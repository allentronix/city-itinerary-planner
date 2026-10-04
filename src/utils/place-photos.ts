import type { Place } from "../data/types";

// Photos for place cards, from Wikimedia Commons through /api/place-photos.
// Requests made in the same moment (a whole list of cards) are sent together,
// and answers are kept in this browser for 30 days.

export interface PlacePhoto {
  url: string;
  credit: string;
  pageUrl: string;
}

// null: the place has no photo. undefined: not known yet.
type PhotoEntry = PlacePhoto | null;

const CACHE_PREFIX = "itiplanner.place-photo.v1.";
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_KEYS_PER_REQUEST = 50;

const known = new Map<string, PhotoEntry>();
const queued = new Set<string>();
const inFlight = new Set<string>();
// Lookups that failed; not retried until the page is reloaded.
const failed = new Set<string>();

const listeners = new Set<() => void>();
let version = 0;
let isFlushScheduled = false;

function notify() {
  version++;
  listeners.forEach((listener) => listener());
}

export function subscribeToPlacePhotos(onChange: () => void): () => void {
  listeners.add(onChange);

  return () => listeners.delete(onChange);
}

export function getPlacePhotosVersion(): number {
  return version;
}

// The key the server knows the photo by, or null for places without one.
export function getPhotoKey(place: Place): string | null {
  if (place.photoFile) {
    return `File:${place.photoFile}`;
  }

  return place.wikidataId ?? null;
}

function readStored(key: string): PhotoEntry | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    const stored = raw
      ? (JSON.parse(raw) as { savedAt: number; photo: PhotoEntry })
      : null;

    return stored && Date.now() - stored.savedAt < CACHE_MAX_AGE_MS
      ? stored.photo
      : undefined;
  } catch {
    return undefined;
  }
}

function store(key: string, photo: PhotoEntry) {
  known.set(key, photo);

  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ savedAt: Date.now(), photo }),
    );
  } catch {
    // Storage full or blocked: the photo still shows, just isn't kept.
  }
}

export function getPlacePhoto(key: string): PhotoEntry | undefined {
  if (!known.has(key)) {
    const stored = readStored(key);

    if (stored !== undefined) {
      known.set(key, stored);
    }
  }

  return known.get(key);
}

export function isPhotoLookupDone(key: string): boolean {
  return getPlacePhoto(key) !== undefined || failed.has(key);
}

async function fetchBatch(keys: string[]) {
  keys.forEach((key) => inFlight.add(key));

  try {
    const response = await fetch(
      `/api/place-photos?keys=${encodeURIComponent(keys.join("|"))}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const { photos } = (await response.json()) as {
      photos: Record<string, PhotoEntry>;
    };

    for (const key of keys) {
      if (key in photos) {
        store(key, photos[key]);
      } else {
        failed.add(key);
      }
    }
  } catch {
    keys.forEach((key) => failed.add(key));
  } finally {
    keys.forEach((key) => inFlight.delete(key));
    notify();
  }
}

function flush() {
  isFlushScheduled = false;

  const keys = [...queued];
  queued.clear();

  for (let start = 0; start < keys.length; start += MAX_KEYS_PER_REQUEST) {
    void fetchBatch(keys.slice(start, start + MAX_KEYS_PER_REQUEST));
  }
}

// Asks for photos not known yet. Calls made together share one request.
export function requestPlacePhoto(key: string) {
  if (isPhotoLookupDone(key) || inFlight.has(key) || queued.has(key)) {
    return;
  }

  queued.add(key);

  if (!isFlushScheduled) {
    isFlushScheduled = true;
    setTimeout(flush, 0);
  }
}
