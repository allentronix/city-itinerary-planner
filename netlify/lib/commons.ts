// City photos from Wikidata's "image" property (P18), served by Wikimedia
// Commons. Both are free and need no key. Commons photos usually require
// crediting the photographer and licence, so those are returned too.

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const PHOTO_WIDTH = 1600;
const TIMEOUT_MS = 5000;

// Wikimedia asks API clients to identify themselves.
const HEADERS = {
  "User-Agent":
    "ItiPlanner/0.1 (https://github.com/allentronix/city-itinerary-planner)",
};

export interface CityPhoto {
  url: string;
  credit: string;
}

interface WikidataClaims {
  entities?: Record<
    string,
    {
      claims?: {
        P18?: { mainsnak?: { datavalue?: { value?: string } } }[];
      };
    }
  >;
}

interface CommonsImageInfo {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: {
          thumburl?: string;
          url?: string;
          extmetadata?: {
            Artist?: { value?: string };
            LicenseShortName?: { value?: string };
          };
        }[];
      }
    >;
  };
}

// Commons stores the artist as HTML, often a link; keep just the text.
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Wikimedia responded with HTTP ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function getImageFileName(wikidataId: string): Promise<string | null> {
  const url = new URL(WIKIDATA_API);
  url.search = new URLSearchParams({
    action: "wbgetentities",
    ids: wikidataId,
    props: "claims",
    format: "json",
  }).toString();

  const data = await getJson<WikidataClaims>(url);

  return (
    data.entities?.[wikidataId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value ??
    null
  );
}

// The city's main photo with its credit, or null if it has none.
export async function getCityPhoto(
  wikidataId: string,
): Promise<CityPhoto | null> {
  if (!/^Q\d+$/.test(wikidataId)) {
    return null;
  }

  const fileName = await getImageFileName(wikidataId);

  if (!fileName) {
    return null;
  }

  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({
    action: "query",
    titles: `File:${fileName}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(PHOTO_WIDTH),
    format: "json",
  }).toString();

  const data = await getJson<CommonsImageInfo>(url);
  const [page] = Object.values(data.query?.pages ?? {});
  const info = page?.imageinfo?.[0];
  const imageUrl = info?.thumburl ?? info?.url;

  if (!imageUrl) {
    return null;
  }

  const artist = stripHtml(info?.extmetadata?.Artist?.value ?? "");
  const license = info?.extmetadata?.LicenseShortName?.value ?? "";

  return {
    url: imageUrl,
    credit: [artist, license].filter(Boolean).join(", "),
  };
}
