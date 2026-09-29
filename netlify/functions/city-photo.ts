import { getCityWikidataId } from "../lib/city-wikidata";
import { getCityPhoto, type CityPhoto } from "../lib/commons";
import {
  errorResponse,
  jsonResponse,
  THIRTY_DAYS_MS,
  withCache,
} from "../lib/geoapify";
import { UsageLimitError } from "../lib/usage";

// GET /api/city-photo?city=<Geoapify place id>
// Returns { photo: { url, credit } } or { photo: null }. Finding the city's
// Wikidata entry costs about one Geoapify credit, once, then everything is cached.

const CACHE_VERSION = 1;

async function loadPhoto(
  cityId: string,
  visitorIp: string,
): Promise<CityPhoto | null> {
  const wikidataId = await getCityWikidataId(cityId, visitorIp);

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
