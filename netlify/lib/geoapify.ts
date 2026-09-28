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
  const store = getStore(CACHE_STORE);
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
