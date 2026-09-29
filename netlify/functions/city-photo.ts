import { getCityPhoto, type CityPhoto } from "../lib/commons";
import {
  callGeoapify,
  errorResponse,
  jsonResponse,
  THIRTY_DAYS_MS,
  withCache,
} from "../lib/geoapify";
import { reserveCredits, UsageLimitError } from "../lib/usage";

// GET /api/city-photo?city=<Geoapify place id>
// Returns { photo: { url, credit } } or { photo: null }. Costs about one
// Geoapify credit per city (to find its Wikidata entry), once, then cached.

const CACHE_VERSION = 1;

interface GeoapifyPlaceDetails {
  features?: {
    properties: {
      wiki_and_media?: { wikidata?: string };
      datasource?: { raw?: { wikidata?: string } };
    };
  }[];
}

async function loadPhoto(
  cityId: string,
  visitorIp: string,
): Promise<CityPhoto | null> {
  await reserveCredits(visitorIp, 1);

  const details = await callGeoapify<GeoapifyPlaceDetails>(
    "/v2/place-details",
    { id: cityId, features: "details" },
  );

  const properties = details.features?.[0]?.properties;
  const wikidataId =
    properties?.wiki_and_media?.wikidata ??
    properties?.datasource?.raw?.wikidata;

  return wikidataId ? getCityPhoto(wikidataId) : null;
}

export default async function handler(
  request: Request,
  context: { ip?: string },
): Promise<Response> {
  const cityId = new URL(request.url).searchParams.get("city") ?? "";

  if (!/^[0-9a-f]{10,200}$/i.test(cityId)) {
    return errorResponse("Missing or invalid city.", 400);
  }

  try {
    const photo = await withCache(
      `city-photo:v${CACHE_VERSION}:${cityId}`,
      THIRTY_DAYS_MS,
      () => loadPhoto(cityId, context.ip ?? "unknown"),
    );

    return jsonResponse({ photo });
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return errorResponse(error.message, 429);
    }

    console.error("City photo lookup failed:", error);

    // A missing photo shouldn't break the page; the banner falls back to plain.
    return jsonResponse({ photo: null });
  }
}
