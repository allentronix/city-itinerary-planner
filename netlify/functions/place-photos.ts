import { getPlacePhotos, type PlacePhoto } from "../lib/commons";
import {
  errorResponse,
  readCacheMany,
  THIRTY_DAYS_MS,
  writeCache,
} from "../lib/geoapify";

// GET /api/place-photos?keys=Q10285|File:Colosseo 2020.jpg
// (Separated by "|", which file names can't contain; commas they can.)
// Returns { photos: { [key]: { url, credit, pageUrl } | null } } for up to 50
// places. Photos come from Wikimedia Commons (free, no key) and each answer
// is cached for everyone for 30 days.

const CACHE_VERSION = 2;
const MAX_KEYS = 50;

// A Wikidata id, or a Commons file name without characters titles can't have.
const VALID_KEY = /^(Q\d{1,12}|File:[^|#<>[\]{}\n]{1,240})$/;

function cacheKey(key: string): string {
  return `place-photo:v${CACHE_VERSION}:${key}`;
}

export default async function handler(request: Request): Promise<Response> {
  const keys = [
    ...new Set(
      (new URL(request.url).searchParams.get("keys") ?? "")
        .split("|")
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  ];

  if (keys.length === 0 || keys.length > MAX_KEYS) {
    return errorResponse(`Send between 1 and ${MAX_KEYS} keys.`, 400);
  }

  if (!keys.every((key) => VALID_KEY.test(key))) {
    return errorResponse("Invalid photo key.", 400);
  }

  const cached = await readCacheMany<PlacePhoto | null>(
    keys.map(cacheKey),
    THIRTY_DAYS_MS,
  );

  const photos: Record<string, PlacePhoto | null> = {};
  const missing: string[] = [];

  for (const key of keys) {
    const hit = cached.get(cacheKey(key));

    if (hit === undefined) {
      missing.push(key);
    } else {
      photos[key] = hit;
    }
  }

  if (missing.length > 0) {
    try {
      const found = await getPlacePhotos(missing);

      await Promise.all(
        missing.map((key) => {
          photos[key] = found.get(key) ?? null;
          return writeCache(cacheKey(key), photos[key]);
        }),
      );
    } catch (error) {
      // Photos are extras: answer with what we have, without caching the gaps.
      console.error("Place photo lookup failed:", error);
    }
  }

  return Response.json(
    { photos },
    // Photos rarely change; let browsers and Netlify's CDN reuse answers.
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
