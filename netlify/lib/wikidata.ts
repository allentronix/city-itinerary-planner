// Wikidata is free and needs no key. We use it to rank sights by how many
// Wikipedia languages cover them, and for English names and descriptions.

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const BATCH_SIZE = 50;
const TIMEOUT_MS = 5000;

// Wikimedia asks API clients to identify themselves.
const USER_AGENT =
  "ItiPlanner/0.1 (https://github.com/allentronix/city-itinerary-planner)";

export interface WikidataInfo {
  label?: string;
  description?: string;
  // How many Wikipedia (and sister) sites link to this item; a good fame signal.
  sitelinkCount: number;
}

interface WikidataResponse {
  entities?: Record<
    string,
    {
      labels?: { en?: { value: string } };
      descriptions?: { en?: { value: string } };
      sitelinks?: Record<string, unknown>;
    }
  >;
}

async function fetchBatch(ids: string[]): Promise<Map<string, WikidataInfo>> {
  const url = new URL(WIKIDATA_API);
  url.search = new URLSearchParams({
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "sitelinks|labels|descriptions",
    languages: "en",
    format: "json",
  }).toString();

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Wikidata responded with HTTP ${response.status}.`);
  }

  const data = (await response.json()) as WikidataResponse;
  const info = new Map<string, WikidataInfo>();

  for (const [id, entity] of Object.entries(data.entities ?? {})) {
    info.set(id, {
      label: entity.labels?.en?.value,
      description: entity.descriptions?.en?.value,
      sitelinkCount: Object.keys(entity.sitelinks ?? {}).length,
    });
  }

  return info;
}

// Looks up many Wikidata items at once. Returns an empty map if Wikidata is
// unavailable, so callers can still work without it.
export async function getWikidataInfo(
  ids: string[],
): Promise<Map<string, WikidataInfo>> {
  const uniqueIds = [...new Set(ids)].filter((id) => /^Q\d+$/.test(id));
  const batches: string[][] = [];

  for (let start = 0; start < uniqueIds.length; start += BATCH_SIZE) {
    batches.push(uniqueIds.slice(start, start + BATCH_SIZE));
  }

  try {
    const results = await Promise.all(batches.map(fetchBatch));

    return new Map(results.flatMap((result) => [...result]));
  } catch (error) {
    console.error("Wikidata lookup failed:", error);

    return new Map();
  }
}
