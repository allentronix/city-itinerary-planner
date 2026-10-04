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

// --- Place photos -----------------------------------------------------------
// Small photos for place cards, looked up many at a time: two requests for up
// to 50 places, instead of two per place.

const PLACE_PHOTO_WIDTH = 500;
const BATCH_SIZE = 50;

export interface PlacePhoto {
  url: string;
  credit: string;
  // The photo's Commons page, with its full licence and author.
  pageUrl: string;
}

interface WikidataPageProps {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        pageprops?: { page_image_free?: string; page_image?: string };
      }
    >;
  };
}

interface CommonsImageInfoBatch {
  query?: {
    normalized?: { from: string; to: string }[];
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: {
          thumburl?: string;
          url?: string;
          descriptionurl?: string;
          extmetadata?: {
            Artist?: { value?: string };
            LicenseShortName?: { value?: string };
          };
        }[];
      }
    >;
  };
}

function inBatches<T>(items: T[]): T[][] {
  const batches: T[][] = [];

  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    batches.push(items.slice(start, start + BATCH_SIZE));
  }

  return batches;
}

// Each Wikidata item's main photo file, e.g. "Q10285" -> "Colosseo_2020.jpg".
// Much lighter than reading the items' full data.
async function getMainImageFiles(ids: string[]): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  for (const batch of inBatches(ids)) {
    const url = new URL(WIKIDATA_API);
    url.search = new URLSearchParams({
      action: "query",
      prop: "pageprops",
      ppprop: "page_image_free|page_image",
      titles: batch.join("|"),
      format: "json",
    }).toString();

    const data = await getJson<WikidataPageProps>(url);

    for (const page of Object.values(data.query?.pages ?? {})) {
      const file =
        page.pageprops?.page_image_free ?? page.pageprops?.page_image;

      if (page.title && file) {
        files.set(page.title, file);
      }
    }
  }

  return files;
}

// Thumbnail, credit and Commons page for each file name.
async function getPhotoDetails(
  fileNames: string[],
): Promise<Map<string, PlacePhoto>> {
  const photos = new Map<string, PlacePhoto>();

  for (const batch of inBatches(fileNames)) {
    const titles = batch.map((name) => `File:${name}`);

    const url = new URL(COMMONS_API);
    url.search = new URLSearchParams({
      action: "query",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiextmetadatafilter: "Artist|LicenseShortName",
      iiurlwidth: String(PLACE_PHOTO_WIDTH),
      titles: titles.join("|"),
      format: "json",
    }).toString();

    const data = await getJson<CommonsImageInfoBatch>(url);

    // Commons answers with tidied titles ("Colosseo 2020.jpg"); map them back.
    const requestedTitle = new Map(
      (data.query?.normalized ?? []).map(({ from, to }) => [to, from]),
    );

    for (const page of Object.values(data.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      const imageUrl = info?.thumburl ?? info?.url;

      if (!page.title || !imageUrl) {
        continue;
      }

      const title = requestedTitle.get(page.title) ?? page.title;
      const artist = stripHtml(info?.extmetadata?.Artist?.value ?? "");
      const license = info?.extmetadata?.LicenseShortName?.value ?? "";

      photos.set(title.replace(/^File:/, ""), {
        url: imageUrl,
        credit: [artist, license].filter(Boolean).join(", "),
        pageUrl: info?.descriptionurl ?? "",
      });
    }
  }

  return photos;
}

// Commons treats "Colosseo_2020.jpg" and "colosseo 2020.jpg" as one file;
// writing names the same way keeps them from being looked up twice.
function toCanonicalFileName(name: string): string {
  const spaced = name.replace(/_/g, " ").replace(/\s+/g, " ").trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Photos for places, by key: a Wikidata id ("Q10285") or a Commons file
// ("File:Colosseo 2020.jpg"). Places without a photo map to null.
export async function getPlacePhotos(
  keys: string[],
): Promise<Map<string, PlacePhoto | null>> {
  const ids = keys.filter((key) => /^Q\d+$/.test(key));
  const imageFiles = await getMainImageFiles(ids);

  const fileFor = (key: string) => {
    const name = key.startsWith("File:") ? key.slice(5) : imageFiles.get(key);

    return name === undefined ? undefined : toCanonicalFileName(name);
  };

  const fileNames = [
    ...new Set(keys.map(fileFor).filter((name) => name !== undefined)),
  ];
  const details = await getPhotoDetails(fileNames);

  return new Map(
    keys.map((key) => {
      const fileName = fileFor(key);

      return [key, (fileName && details.get(fileName)) || null];
    }),
  );
}
