import type { CityInfo, Place } from "../data/types";

// Talks to the Netlify functions in /netlify/functions (served at /api/*).

export type PlaceType = "sights" | "restaurants" | "cafes" | "activities";

export const PLACE_TYPES: PlaceType[] = [
  "sights",
  "restaurants",
  "cafes",
  "activities",
];

export type PlacesEntry =
  | { status: "loading" }
  | { status: "ready"; places: Place[] }
  | { status: "error"; message: string };

// v2: places carry photo sources.
const BROWSER_CACHE_PREFIX = "itiplanner.places.v2";
const BROWSER_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }

  return data;
}

export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<CityInfo[]> {
  const data = await getJson<{ cities: CityInfo[] }>(
    `/api/cities?${new URLSearchParams({ q: query })}`,
    signal,
  );

  return data.cities;
}

// --- Places store ---------------------------------------------------------
// Each city and type is fetched at most once per session and kept in the
// browser for a week, so reopening a city usually costs no request at all.

const entries = new Map<string, PlacesEntry>();
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version++;
  listeners.forEach((listener) => listener());
}

function entryKey(cityId: string, type: PlaceType): string {
  return `${cityId}:${type}`;
}

function readBrowserCache(key: string): Place[] | null {
  try {
    const raw = localStorage.getItem(`${BROWSER_CACHE_PREFIX}.${key}`);

    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw) as { savedAt: number; places: Place[] };

    return Date.now() - cached.savedAt < BROWSER_CACHE_MAX_AGE_MS
      ? cached.places
      : null;
  } catch {
    return null;
  }
}

function writeBrowserCache(key: string, places: Place[]) {
  try {
    localStorage.setItem(
      `${BROWSER_CACHE_PREFIX}.${key}`,
      JSON.stringify({ savedAt: Date.now(), places }),
    );
  } catch {
    // Storage full or blocked: the places still work for this visit.
  }
}

export function subscribeToPlaces(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

// Changes whenever any entry changes, for useSyncExternalStore.
export function getPlacesVersion(): number {
  return version;
}

export function getPlacesEntry(
  cityId: string,
  type: PlaceType,
): PlacesEntry | undefined {
  return entries.get(entryKey(cityId, type));
}

// Starts loading places unless they're loaded or already loading.
// Failed loads are retried when requested again.
export function requestPlaces(
  city: CityInfo & { wikidataId?: string },
  type: PlaceType,
) {
  const key = entryKey(city.id, type);
  const existing = entries.get(key);

  if (existing && existing.status !== "error") {
    return;
  }

  const cached = readBrowserCache(key);

  if (cached) {
    entries.set(key, { status: "ready", places: cached });
    notify();
    return;
  }

  entries.set(key, { status: "loading" });
  notify();

  const params = new URLSearchParams({ city: city.id, type });

  // Built-in cities know their Wikidata id, so "Things to do" needs no Geoapify lookup.
  if (type === "activities" && city.wikidataId) {
    params.set("wikidata", city.wikidataId);
  }

  if (city.lat !== undefined && city.lon !== undefined) {
    params.set("lat", String(city.lat));
    params.set("lon", String(city.lon));
  }

  getJson<{ places: Place[] }>(`/api/places?${params}`)
    .then(({ places }) => {
      entries.set(key, { status: "ready", places });
      writeBrowserCache(key, places);
    })
    .catch((error: Error) => {
      entries.set(key, { status: "error", message: error.message });
    })
    .finally(notify);
}

// --- City photos ----------------------------------------------------------
// Photos for cities found through search, from Wikimedia Commons. Looked up
// once per city and kept in the browser for 30 days.

export interface CityPhoto {
  url: string;
  credit: string;
}

const PHOTO_CACHE_PREFIX = "itiplanner.city-photo.v1";
const PHOTO_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// undefined: not looked up yet; null: loading, failed, or the city has no photo.
const photos = new Map<string, CityPhoto | null>();

export function getCityPhoto(cityId: string): CityPhoto | null | undefined {
  return photos.get(cityId);
}

export function requestCityPhoto(cityId: string) {
  if (photos.has(cityId)) {
    return;
  }

  const cacheKey = `${PHOTO_CACHE_PREFIX}.${cityId}`;

  try {
    const raw = localStorage.getItem(cacheKey);
    const cached = raw
      ? (JSON.parse(raw) as { savedAt: number; photo: CityPhoto | null })
      : null;

    if (cached && Date.now() - cached.savedAt < PHOTO_CACHE_MAX_AGE_MS) {
      photos.set(cityId, cached.photo);
      notify();
      return;
    }
  } catch {
    // Unreadable cache: look it up again.
  }

  photos.set(cityId, null);

  getJson<{ photo: CityPhoto | null }>(
    `/api/city-photo?${new URLSearchParams({ city: cityId })}`,
  )
    .then(({ photo }) => {
      photos.set(cityId, photo);

      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ savedAt: Date.now(), photo }),
        );
      } catch {
        // Storage full or blocked: the photo still shows for this visit.
      }
    })
    .catch(() => {
      // No photo is fine: banners and cards fall back to a plain background.
    })
    .finally(notify);
}
