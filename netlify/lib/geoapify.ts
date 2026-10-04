import { getStore } from "@netlify/blobs";

const GEOAPIFY_BASE_URL = "https://api.geoapify.com";

const CACHE_STORE = "geoapify-cache";

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  savedAt: number;
  data: T;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    // Let browsers reuse identical answers for a few minutes.
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

// Lowercase, trimmed and without accents, so "São Paulo" matches "sao paulo".
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

// Netlify exposes site variables through Netlify.env in functions; process.env
// covers local development and older runtimes.
declare const Netlify:
  { env: { get(name: string): string | undefined } } | undefined;

export function getGeoapifyApiKey(): string | undefined {
  const fromNetlify =
    typeof Netlify !== "undefined"
      ? Netlify.env.get("GEOAPIFY_API_KEY")
      : undefined;

  return (fromNetlify ?? process.env.GEOAPIFY_API_KEY)?.trim() || undefined;
}

export async function callGeoapify<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const apiKey = getGeoapifyApiKey();

  if (!apiKey) {
    throw new Error("GEOAPIFY_API_KEY is not configured.");
  }

  const url = new URL(path, GEOAPIFY_BASE_URL);
  url.search = new URLSearchParams({ ...params, apiKey }).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geoapify responded with HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

// Returns the cached value for this key, or loads it once and caches it for everyone.
export async function withCache<T>(
  key: string,
  maxAgeMs: number,
  load: () => Promise<T>,
): Promise<T> {
  // "strong" makes new values readable right away; the default can lag up to
  // a minute, letting a second visitor miss the cache and spend credits again.
  const store = getStore({ name: CACHE_STORE, consistency: "strong" });
  const blobKey = encodeURIComponent(key);

  const cached = (await store.get(blobKey, {
    type: "json",
  })) as CacheEntry<T> | null;

  if (cached && Date.now() - cached.savedAt < maxAgeMs) {
    return cached.data;
  }

  const data = await load();
  const entry: CacheEntry<T> = { savedAt: Date.now(), data };

  await store.setJSON(blobKey, entry);

  return data;
}

// Cached values for several keys at once; keys missing or too old are left out.
export async function readCacheMany<T>(
  keys: string[],
  maxAgeMs: number,
): Promise<Map<string, T>> {
  const store = getStore({ name: CACHE_STORE, consistency: "strong" });

  const entries = await Promise.all(
    keys.map(
      async (key) =>
        [
          key,
          (await store.get(encodeURIComponent(key), {
            type: "json",
          })) as CacheEntry<T> | null,
        ] as const,
    ),
  );

  return new Map(
    entries
      .filter(([, entry]) => entry && Date.now() - entry.savedAt < maxAgeMs)
      .map(([key, entry]) => [key, (entry as CacheEntry<T>).data]),
  );
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  const store = getStore({ name: CACHE_STORE, consistency: "strong" });
  const entry: CacheEntry<T> = { savedAt: Date.now(), data };

  await store.setJSON(encodeURIComponent(key), entry);
}
