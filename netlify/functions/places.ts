import type { Place, PlaceCategory } from "../../src/data/types";
import popularCities from "../lib/popular-cities.json";
import {
  callGeoapify,
  errorResponse,
  jsonResponse,
  THIRTY_DAYS_MS,
  withCache,
} from "../lib/geoapify";
import { reserveCredits, UsageLimitError } from "../lib/usage";
import { getWikidataInfo, type WikidataInfo } from "../lib/wikidata";
import { findFamousSights } from "../lib/famous-sights";
import { getCityWikidataId, isWikidataId } from "../lib/city-wikidata";
import { getActivities, type Activity } from "../lib/wikivoyage";

// GET /api/places?city=<Geoapify place id>&type=sights|restaurants|cafes[&lat=&lon=]
// Returns about 20 places for one city and type. Each city and type is fetched
// from Geoapify once, then served from the shared cache for 30 days.

type PlaceType = "sights" | "restaurants" | "cafes";

interface PlaceTypeConfig {
  category: PlaceCategory;
  geoapifyCategories: string;
  // Candidates fetched before ranking; Geoapify charges about 1 credit per 20.
  candidates: number;
}

const PLACE_TYPES: Record<PlaceType, PlaceTypeConfig> = {
  sights: {
    category: "attraction",
    geoapifyCategories:
      "tourism.attraction,tourism.sights,entertainment.museum,heritage",
    candidates: 300,
  },
  restaurants: {
    category: "restaurant",
    geoapifyCategories: "catering.restaurant",
    candidates: 40,
  },
  cafes: {
    category: "cafe",
    geoapifyCategories: "catering.cafe",
    candidates: 40,
  },
};

const RESULTS_PER_TYPE = 20;
// Version 4 added Wikidata ids, for place photos.
const CACHE_VERSION = 4;
const MAX_DESCRIPTION_LENGTH = 140;
const MAX_CUISINES = 2;
// Cuisine tags that don't say anything useful on a card.
const VAGUE_CUISINES = new Set(["coffee_shop", "regional", "local"]);

interface GeoapifyPlaceProperties {
  place_id: string;
  name?: string;
  name_international?: { en?: string };
  categories?: string[];
  address_line2?: string;
  lat: number;
  lon: number;
  opening_hours?: string;
  website?: string;
  // Set on chains, e.g. "Starbucks".
  brand?: string;
  wiki_and_media?: { wikidata?: string };
  catering?: { cuisine?: string };
  datasource?: { raw?: { cuisine?: string } };
}

interface GeoapifyPlaces {
  features?: { properties: GeoapifyPlaceProperties }[];
}

interface Candidate {
  properties: GeoapifyPlaceProperties;
  wikidata?: WikidataInfo;
  // Position in Geoapify's results, which are sorted by distance from the centre.
  distanceRank: number;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "tourism.sights.archaeological_site" -> "Archaeological site"
function describeCategory(categories: string[] = []): string {
  const mostSpecific = [...categories].sort(
    (a, b) => b.split(".").length - a.split(".").length,
  )[0];

  const label = mostSpecific?.split(".").at(-1)?.replace(/_/g, " ");

  return label ? capitalize(label) : "Place of interest";
}

// "regional;seafood;portuguese" -> "Seafood & portuguese"
function describeCuisine(properties: GeoapifyPlaceProperties): string {
  const cuisine =
    properties.catering?.cuisine ?? properties.datasource?.raw?.cuisine ?? "";

  const cuisines = cuisine
    .split(";")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item && !VAGUE_CUISINES.has(item))
    .slice(0, MAX_CUISINES)
    .map((item) => item.replace(/_/g, " "));

  return cuisines.length > 0 ? capitalize(cuisines.join(" & ")) : "";
}

// Cuts long text at a word boundary.
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const cut = text.slice(0, maxLength).replace(/\s+\S*$/, "");

  return `${cut.replace(/[,;:.]$/, "")}…`;
}

function getBestTime(type: PlaceType, categories: string[] = []): string {
  if (type === "restaurants") {
    return "Dinner";
  }

  if (type === "cafes") {
    return "Morning";
  }

  return categories.some((category) => category.includes("viewpoint"))
    ? "Sunset"
    : "Morning";
}

function toPlace(type: PlaceType, candidate: Candidate): Place {
  const { properties, wikidata } = candidate;
  const wikidataId = properties.wiki_and_media?.wikidata;

  const name =
    wikidata?.label ?? properties.name_international?.en ?? properties.name;

  let description: string;

  if (type === "sights") {
    description = wikidata?.description
      ? capitalize(wikidata.description)
      : describeCategory(properties.categories);
  } else {
    const cuisine = describeCuisine(properties);
    const kind = type === "restaurants" ? "restaurant" : "café";

    description = cuisine ? `${cuisine} ${kind}` : capitalize(kind);
  }

  return {
    id: properties.place_id,
    name: capitalize(name ?? "Unnamed place"),
    category: PLACE_TYPES[type].category,
    description: truncate(description, MAX_DESCRIPTION_LENGTH),
    bestTime: getBestTime(type, properties.categories),
    address: properties.address_line2,
    lat: properties.lat,
    lon: properties.lon,
    openingHours: properties.opening_hours,
    website: properties.website,
    wikidataId: isWikidataId(wikidataId) ? wikidataId : undefined,
  };
}

// Sights: most famous first (most Wikipedia languages). Restaurants and cafés:
// local places with listed hours, a website and a cuisine first; chains last.
function rankCandidates(type: PlaceType, candidates: Candidate[]): Candidate[] {
  const score = ({ properties, wikidata }: Candidate): number => {
    if (type === "sights") {
      return wikidata?.sitelinkCount ?? 0;
    }

    return (
      Number(Boolean(properties.opening_hours)) +
      Number(Boolean(properties.website)) +
      Number(Boolean(describeCuisine(properties))) -
      (properties.brand ? 3 : 0)
    );
  };

  return [...candidates].sort(
    (a, b) => score(b) - score(a) || a.distanceRank - b.distanceRank,
  );
}

async function loadPlaces(
  cityId: string,
  type: PlaceType,
  center: { lat: number; lon: number } | null,
  visitorIp: string,
): Promise<Place[]> {
  const config = PLACE_TYPES[type];

  await reserveCredits(visitorIp, Math.ceil(config.candidates / 20));

  const params: Record<string, string> = {
    categories: config.geoapifyCategories,
    conditions: "named",
    filter: `place:${cityId}`,
    limit: String(config.candidates),
  };

  if (center) {
    params.bias = `proximity:${center.lon},${center.lat}`;
  }

  // For sights, look up the city's most famous places at the same time.
  const [data, famousSights] = await Promise.all([
    callGeoapify<GeoapifyPlaces>("/v2/places", params),
    type === "sights" && center ? findFamousSights(center) : [],
  ]);

  let candidates: Candidate[] = (data.features ?? []).map((feature, index) => ({
    properties: feature.properties,
    distanceRank: index,
  }));

  if (type === "sights") {
    // Famous sights already come with their Wikidata details.
    const wikidata = new Map<string, WikidataInfo>(
      famousSights.map((sight) => [sight.wikidataId, sight]),
    );

    const missingIds = candidates
      .map((candidate) => candidate.properties.wiki_and_media?.wikidata)
      .filter((id): id is string => Boolean(id) && !wikidata.has(id as string));

    for (const [id, info] of await getWikidataInfo(missingIds)) {
      wikidata.set(id, info);
    }

    // Add famous sights Geoapify didn't return (e.g. just outside its nearest 300).
    const geoapifyIds = new Set(
      candidates.map(
        (candidate) => candidate.properties.wiki_and_media?.wikidata,
      ),
    );

    const extraCandidates: Candidate[] = famousSights
      .filter((sight) => !geoapifyIds.has(sight.wikidataId))
      .map((sight, index) => ({
        properties: {
          place_id: `wikidata-${sight.wikidataId}`,
          name: sight.label,
          lat: sight.lat,
          lon: sight.lon,
          wiki_and_media: { wikidata: sight.wikidataId },
        },
        distanceRank: candidates.length + index,
      }));

    candidates = [...candidates, ...extraCandidates].map((candidate) => ({
      ...candidate,
      wikidata: wikidata.get(
        candidate.properties.wiki_and_media?.wikidata ?? "",
      ),
    }));
  }

  // The same landmark is often mapped several times (e.g. a building and its grounds).
  const seenNames = new Set<string>();

  return rankCandidates(type, candidates)
    .map((candidate) => toPlace(type, candidate))
    .filter((place) => {
      const key = place.name.toLowerCase();

      if (seenNames.has(key)) {
        return false;
      }

      seenNames.add(key);

      return true;
    })
    .slice(0, RESULTS_PER_TYPE);
}

function parseCenter(
  cityId: string,
  searchParams: URLSearchParams,
): { lat: number; lon: number } | null {
  const popular = (
    popularCities as { id: string; lat: number; lon: number }[]
  ).find((city) => city.id === cityId);

  if (popular) {
    return { lat: popular.lat, lon: popular.lon };
  }

  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  const isValid =
    searchParams.has("lat") &&
    searchParams.has("lon") &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180;

  return isValid ? { lat, lon } : null;
}

// --- Things to do (Wikivoyage) ---------------------------------------------

// Version 3 added photos.
const ACTIVITIES_CACHE_VERSION = 3;

// Listings with a description come first, then those with a location (for
// maps and walking times), then those with hours.
function activityScore(activity: Activity): number {
  return (
    (activity.description ? 2 : 0) +
    (activity.lat !== undefined && activity.lon !== undefined ? 1 : 0) +
    (activity.hours ? 0.5 : 0)
  );
}

// "Ramen Cooking Tokyo" -> "ramen-cooking-tokyo"
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadActivities(wikidataId: string): Promise<Place[]> {
  const seenNames = new Set<string>();
  const usedIds = new Set<string>();

  return (await getActivities(wikidataId))
    .map((activity, order) => ({ activity, order }))
    .sort(
      (a, b) =>
        activityScore(b.activity) - activityScore(a.activity) ||
        a.order - b.order,
    )
    .map(({ activity }) => activity)
    .filter((activity) => {
      const key = activity.name.toLowerCase();

      if (seenNames.has(key)) {
        return false;
      }

      seenNames.add(key);

      return true;
    })
    .slice(0, RESULTS_PER_TYPE)
    .map((activity) => {
      let id = `wikivoyage-${slugify(activity.name) || "activity"}`;

      while (usedIds.has(id)) {
        id += "-2";
      }

      usedIds.add(id);

      return {
        id,
        name: capitalize(activity.name),
        category: "activity",
        description: truncate(
          activity.description || "Activity",
          MAX_DESCRIPTION_LENGTH,
        ),
        bestTime: "Afternoon",
        address: activity.address,
        lat: activity.lat,
        lon: activity.lon,
        openingHours: activity.hours,
        website: activity.website,
        wikidataId: activity.wikidataId,
        photoFile: activity.image,
      };
    });
}

// GET /api/places?type=activities&wikidata=Q220  (built-in cities: no credits)
// GET /api/places?type=activities&city=<Geoapify place id>  (about 1 credit, once)
async function handleActivities(
  searchParams: URLSearchParams,
  visitorIp: string,
): Promise<Response> {
  const cityId = searchParams.get("city") ?? "";
  let wikidataId = searchParams.get("wikidata");

  if (!isWikidataId(wikidataId)) {
    if (!/^[0-9a-f]{10,200}$/i.test(cityId)) {
      return errorResponse("Missing or invalid city.", 400);
    }

    wikidataId = await getCityWikidataId(cityId, visitorIp);
  }

  if (!wikidataId) {
    return jsonResponse({ places: [] });
  }

  const places = await withCache(
    `activities:v${ACTIVITIES_CACHE_VERSION}:${wikidataId}`,
    THIRTY_DAYS_MS,
    () => loadActivities(wikidataId as string),
  );

  return jsonResponse({ places });
}

export default async function handler(
  request: Request,
  context: { ip?: string },
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("city") ?? "";
  const type = searchParams.get("type") ?? "";
  const visitorIp = context.ip ?? "unknown";

  if (type !== "activities" && !(type in PLACE_TYPES)) {
    return errorResponse(
      "Type must be sights, restaurants, cafes or activities.",
      400,
    );
  }

  if (type === "activities") {
    try {
      return await handleActivities(searchParams, visitorIp);
    } catch (error) {
      if (error instanceof UsageLimitError) {
        return errorResponse(error.message, 429);
      }

      console.error("Activities lookup failed:", error);

      return errorResponse(
        "Couldn't load things to do right now. Please try again.",
        502,
      );
    }
  }

  if (!/^[0-9a-f]{10,200}$/i.test(cityId)) {
    return errorResponse("Missing or invalid city.", 400);
  }

  const placeType = type as PlaceType;
  const center = parseCenter(cityId, searchParams);

  try {
    const places = await withCache(
      `places:v${CACHE_VERSION}:${cityId}:${placeType}`,
      THIRTY_DAYS_MS,
      () => loadPlaces(cityId, placeType, center, visitorIp),
    );

    return jsonResponse({ places });
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return errorResponse(error.message, 429);
    }

    console.error("Places lookup failed:", error);

    return errorResponse(
      "Couldn't load places right now. Please try again.",
      502,
    );
  }
}
