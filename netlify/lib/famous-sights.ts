// Finds a city's best-known sights with free Wikipedia and Wikidata lookups.
// Geoapify's list is sorted by distance from the centre, so in dense cities
// famous places a kilometre away (like Rome's Pantheon) can miss it. This
// fills those gaps. Anything slow or failing just returns fewer sights.

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

// Wikimedia asks API clients to identify themselves.
const HEADERS = {
  "User-Agent":
    "ItiPlanner/0.1 (https://github.com/allentronix/city-itinerary-planner)",
};

const SEARCH_RADIUS_METRES = 10000; // Wikipedia's maximum.
const MAX_ARTICLES = 500; // Wikipedia's maximum; the nearest are returned.
const MIN_SITELINKS = 15; // Covered in at least this many languages.
const MAX_TYPE_CHECKS = 60; // Type-check only the most famous candidates.
const SITELINK_BATCH_SIZE = 50;
// Famous places carry a lot of data, so smaller parallel batches are faster.
const TYPE_BATCH_SIZE = 10;
const REQUEST_TIMEOUT_MS = 4000;
const OVERALL_TIMEOUT_MS = 5000;

// Wikidata "instance of" types that count as sights. Checked directly, not
// through the type hierarchy, which is far too slow to query.
const SIGHT_TYPES = new Set([
  // Museums and galleries
  "Q33506",
  "Q207694",
  "Q2772772",
  "Q2087181",
  "Q17431399",
  "Q1007870",
  // Churches, cathedrals, mosques, synagogues, temples, monasteries
  "Q16970",
  "Q1088552",
  "Q163687",
  "Q120560",
  "Q2977",
  "Q56242215",
  "Q32815",
  "Q34627",
  "Q44539",
  "Q108325",
  "Q160742",
  "Q44613",
  "Q2750108",
  "Q15640612",
  "Q1068640",
  // Castles, fortresses, palaces, parliament buildings, mausoleums
  "Q23413",
  "Q57821",
  "Q16560",
  "Q53536964",
  "Q1802963",
  "Q15848826",
  "Q162875",
  // Squares, fountains, monuments, arches, obelisks, statues, columns, gates, walls, aqueducts
  "Q174782",
  "Q483453",
  "Q4989906",
  "Q5003624",
  "Q54831",
  "Q170980",
  "Q179700",
  "Q4817",
  "Q82117",
  "Q16748868",
  "Q474",
  // Archaeological sites, amphitheatres, ruins
  "Q839954",
  "Q1370598",
  "Q109607",
  "Q2065736",
  "Q1454631",
  // Bridges, towers, skyscrapers, lighthouses, lifts, funiculars, viewpoints
  "Q12280",
  "Q12518",
  "Q1440300",
  "Q11303",
  "Q39715",
  "Q2016147",
  "Q132911",
  "Q142031",
  "Q6017969",
  // Parks, gardens, zoos, pedestrian streets
  "Q22698",
  "Q1107656",
  "Q167346",
  "Q43501",
  "Q3840711",
  // Opera houses, theatres, concert halls, stadiums, markets, attractions, landmarks
  "Q153562",
  "Q24354",
  "Q1060829",
  "Q483110",
  "Q37654",
  "Q1076486",
  "Q570116",
  "Q2319498",
]);

export interface FamousSight {
  wikidataId: string;
  lat: number;
  lon: number;
  label?: string;
  description?: string;
  sitelinkCount: number;
}

interface GeosearchResponse {
  query?: {
    pages?: {
      pageprops?: { wikibase_item?: string };
      coordinates?: { lat: number; lon: number }[];
    }[];
  };
}

interface EntitiesResponse {
  entities?: Record<
    string,
    {
      sitelinks?: Record<string, unknown>;
      labels?: { en?: { value: string } };
      descriptions?: { en?: { value: string } };
      claims?: {
        P31?: { mainsnak?: { datavalue?: { value?: { id?: string } } } }[];
      };
    }
  >;
}

async function getJson<T>(base: string, params: Record<string, string>) {
  const url = new URL(base);
  url.search = new URLSearchParams({ ...params, format: "json" }).toString();

  const response = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Wikimedia responded with HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

function inBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];

  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }

  return batches;
}

async function findSights(center: {
  lat: number;
  lon: number;
}): Promise<FamousSight[]> {
  // 1. Wikipedia articles near the centre, with their coordinates.
  const nearby = await getJson<GeosearchResponse>(WIKIPEDIA_API, {
    action: "query",
    generator: "geosearch",
    ggscoord: `${center.lat}|${center.lon}`,
    ggsradius: String(SEARCH_RADIUS_METRES),
    ggslimit: String(MAX_ARTICLES),
    prop: "pageprops|coordinates",
    ppprop: "wikibase_item",
    colimit: String(MAX_ARTICLES),
    formatversion: "2",
  });

  const locations = new Map<string, { lat: number; lon: number }>();

  for (const page of nearby.query?.pages ?? []) {
    const id = page.pageprops?.wikibase_item;
    const coordinates = page.coordinates?.[0];

    if (id && coordinates) {
      locations.set(id, { lat: coordinates.lat, lon: coordinates.lon });
    }
  }

  // 2. How many languages cover each one: the fame signal.
  const sitelinkCounts = new Map<string, number>();

  await Promise.all(
    inBatches([...locations.keys()], SITELINK_BATCH_SIZE).map(async (ids) => {
      const data = await getJson<EntitiesResponse>(WIKIDATA_API, {
        action: "wbgetentities",
        ids: ids.join("|"),
        props: "sitelinks",
      });

      for (const [id, entity] of Object.entries(data.entities ?? {})) {
        sitelinkCounts.set(id, Object.keys(entity.sitelinks ?? {}).length);
      }
    }),
  );

  const mostFamous = [...sitelinkCounts]
    .filter(([, count]) => count >= MIN_SITELINKS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TYPE_CHECKS)
    .map(([id]) => id);

  // 3. Keep only real sights, with English names and descriptions.
  const sights: FamousSight[] = [];

  await Promise.all(
    inBatches(mostFamous, TYPE_BATCH_SIZE).map(async (ids) => {
      const data = await getJson<EntitiesResponse>(WIKIDATA_API, {
        action: "wbgetentities",
        ids: ids.join("|"),
        props: "claims|labels|descriptions",
        languages: "en",
      });

      for (const [id, entity] of Object.entries(data.entities ?? {})) {
        const types = (entity.claims?.P31 ?? []).map(
          (claim) => claim.mainsnak?.datavalue?.value?.id,
        );
        const location = locations.get(id);

        if (location && types.some((type) => type && SIGHT_TYPES.has(type))) {
          sights.push({
            wikidataId: id,
            ...location,
            label: entity.labels?.en?.value,
            description: entity.descriptions?.en?.value,
            sitelinkCount: sitelinkCounts.get(id) ?? 0,
          });
        }
      }
    }),
  );

  return sights.sort((a, b) => b.sitelinkCount - a.sitelinkCount);
}

// The city's best-known sights near its centre, most famous first.
// Returns an empty list instead of failing or taking too long.
export async function findFamousSights(center: {
  lat: number;
  lon: number;
}): Promise<FamousSight[]> {
  const timeout = new Promise<FamousSight[]>((resolve) =>
    setTimeout(() => resolve([]), OVERALL_TIMEOUT_MS),
  );

  try {
    return await Promise.race([findSights(center), timeout]);
  } catch (error) {
    console.error("Famous sights lookup failed:", error);

    return [];
  }
}
