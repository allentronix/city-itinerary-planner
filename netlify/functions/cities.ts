import popularCities from "../lib/popular-cities.json";
import {
  callGeoapify,
  errorResponse,
  jsonResponse,
  normalizeText,
  THIRTY_DAYS_MS,
  withCache,
} from "../lib/geoapify";
import { reserveCredits } from "../lib/usage";

// GET /api/cities?q=lis
// Searches the bundled popular cities first (no credits). Only when that finds
// few matches does it ask Geoapify, and that answer is cached for everyone.

export interface CityResult {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

interface GeoapifyAutocomplete {
  results?: {
    place_id: string;
    city?: string;
    name?: string;
    country?: string;
    country_code?: string;
    lat: number;
    lon: number;
    // "populated_place" for real towns and cities, "administrative" for districts.
    category?: string;
    rank?: { importance?: number };
  }[];
}

const MAX_RESULTS = 8;
const MAX_QUERY_LENGTH = 60;
// Below this many local matches, also ask Geoapify.
const MIN_LOCAL_MATCHES = 3;
// Don't spend credits on one- or two-letter searches.
const MIN_REMOTE_QUERY_LENGTH = 3;
// Bump to ignore answers cached by an older version of this function.
const CACHE_VERSION = 3;
// Skip villages too small to plan a city trip around.
const MIN_IMPORTANCE = 0.3;
// Administrative areas this prominent are still kept (some large cities are tagged that way).
const MIN_ADMINISTRATIVE_IMPORTANCE = 0.5;

function cityKey(city: CityResult): string {
  return `${normalizeText(city.name)}|${city.countryCode}`;
}

function searchPopularCities(query: string): CityResult[] {
  const ranked: { city: CityResult; rank: number }[] = [];

  for (const city of popularCities as CityResult[]) {
    const name = normalizeText(city.name);

    const rank = name.startsWith(query)
      ? 0
      : name.split(/[\s-]+/).some((word) => word.startsWith(query))
        ? 1
        : normalizeText(city.country).startsWith(query)
          ? 2
          : -1;

    if (rank >= 0) {
      ranked.push({ city, rank });
    }
  }

  return ranked
    .sort((a, b) => a.rank - b.rank || a.city.name.localeCompare(b.city.name))
    .map(({ city }) => city);
}

async function searchGeoapify(
  query: string,
  visitorIp: string,
): Promise<CityResult[]> {
  return withCache(
    `cities:v${CACHE_VERSION}:${query}`,
    THIRTY_DAYS_MS,
    async () => {
      await reserveCredits(visitorIp, 1);

      const data = await callGeoapify<GeoapifyAutocomplete>(
        "/v1/geocode/autocomplete",
        { text: query, type: "city", limit: "5", format: "json" },
      );

      return (data.results ?? [])
        .filter((result) => {
          const importance = result.rank?.importance ?? 0;

          return (
            Boolean(result.name ?? result.city) &&
            importance >= MIN_IMPORTANCE &&
            (result.category === "populated_place" ||
              importance >= MIN_ADMINISTRATIVE_IMPORTANCE)
          );
        })
        .sort((a, b) => (b.rank?.importance ?? 0) - (a.rank?.importance ?? 0))
        .map((result) => ({
          id: result.place_id,
          name: (result.name ?? result.city) as string,
          country: result.country ?? "",
          countryCode: result.country_code ?? "",
          lat: result.lat,
          lon: result.lon,
        }));
    },
  );
}

export default async function handler(
  request: Request,
  context: { ip?: string },
): Promise<Response> {
  const rawQuery = new URL(request.url).searchParams.get("q") ?? "";
  const query = normalizeText(rawQuery);

  if (!query) {
    return jsonResponse({ cities: [] });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return errorResponse("Search text is too long.", 400);
  }

  const localMatches = searchPopularCities(query);

  if (
    localMatches.length >= MIN_LOCAL_MATCHES ||
    query.length < MIN_REMOTE_QUERY_LENGTH
  ) {
    return jsonResponse({ cities: localMatches.slice(0, MAX_RESULTS) });
  }

  try {
    const remoteMatches = await searchGeoapify(query, context.ip ?? "unknown");

    // Popular cities first; skip Geoapify results for cities we already list.
    const known = new Set(localMatches.map(cityKey));
    const cities = [
      ...localMatches,
      ...remoteMatches.filter((city) => !known.has(cityKey(city))),
    ].slice(0, MAX_RESULTS);

    return jsonResponse({ cities });
  } catch (error) {
    console.error("City search failed:", error);

    // Still return what we found locally.
    return jsonResponse({
      cities: localMatches.slice(0, MAX_RESULTS),
      partial: true,
    });
  }
}
