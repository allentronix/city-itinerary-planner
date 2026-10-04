// "Things to do" from Wikivoyage, the free travel guide. Each city page (and,
// for big cities, each district page) has a "Do" section of hand-written
// listings: tours, walks, markets, classes, shows and so on.
// Content is CC BY-SA; the app credits Wikivoyage wherever it's shown.

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIVOYAGE_API = "https://en.wikivoyage.org/w/api.php";

// Wikimedia asks API clients to identify themselves.
const HEADERS = {
  "User-Agent":
    "ItiPlanner/0.1 (https://github.com/allentronix/city-itinerary-planner)",
};

const REQUEST_TIMEOUT_MS = 5000;
// Big cities keep most listings on district pages ("London/Westminster").
const MAX_DISTRICT_PAGES = 12;

export interface Activity {
  name: string;
  description: string;
  address?: string;
  hours?: string;
  price?: string;
  website?: string;
  lat?: number;
  lon?: number;
  wikidataId?: string;
  // A Wikimedia Commons file name, e.g. "Colosseo 2020.jpg".
  image?: string;
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

// The English Wikivoyage page linked from a Wikidata item, if there is one.
async function getWikivoyageTitle(wikidataId: string): Promise<string | null> {
  const data = await getJson<{
    entities?: Record<
      string,
      { sitelinks?: { enwikivoyage?: { title: string } } }
    >;
  }>(WIKIDATA_API, {
    action: "wbgetentities",
    ids: wikidataId,
    props: "sitelinks",
    sitefilter: "enwikivoyage",
  });

  return data.entities?.[wikidataId]?.sitelinks?.enwikivoyage?.title ?? null;
}

async function getWikitext(title: string): Promise<string> {
  const data = await getJson<{ parse?: { wikitext?: string } }>(
    WIKIVOYAGE_API,
    {
      action: "parse",
      page: title,
      prop: "wikitext",
      formatversion: "2",
      redirects: "1",
    },
  );

  return data.parse?.wikitext ?? "";
}

// The text of a level-2 section, e.g. "== Do ==", up to the next level-2 heading.
function getSection(wikitext: string, heading: string): string {
  const match = wikitext.match(
    new RegExp(
      `^==\\s*${heading}\\s*==\\s*$([\\s\\S]*?)(?=^==[^=]|(?![\\s\\S]))`,
      "m",
    ),
  );

  return match?.[1] ?? "";
}

// District pages: links inside the page's {{Regionlist}} block (its heading
// varies: "Districts", "Boroughs"…) plus any "City/District" links such as
// [[Rome/Old Rome]]. The base is "Tokyo" even when the page is "Tokyo (prefecture)".
function getDistrictTitles(title: string, wikitext: string): string[] {
  const base = title.replace(/\s*\(.*\)$/, "");
  const titles = new Set<string>();
  const linkPattern = /\[\[([^\]|#]+)/g;

  const regionListStart = wikitext.search(/\{\{\s*Regionlist/i);
  const regionList =
    regionListStart >= 0 ? findTemplateText(wikitext, regionListStart) : "";

  for (const match of regionList.matchAll(linkPattern)) {
    const link = match[1].trim();

    // Skip images and other namespaces ("File:…", "Category:…").
    if (!link.includes(":")) {
      titles.add(link);
    }
  }

  for (const match of wikitext.matchAll(linkPattern)) {
    const link = match[1].trim();

    if (link.startsWith(`${base}/`)) {
      titles.add(link);
    }
  }

  titles.delete(title);

  return [...titles].slice(0, MAX_DISTRICT_PAGES);
}

// The full text of the template starting at `start` ("{{"), nested templates included.
function findTemplateText(text: string, start: number): string {
  let depth = 0;

  for (let index = start; index < text.length - 1; index++) {
    const pair = text.slice(index, index + 2);

    if (pair === "{{") {
      depth++;
      index++;
    } else if (pair === "}}") {
      depth--;
      index++;

      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return text.slice(start);
}

// Finds each "{{do ...}}" or "{{listing | type=do ...}}" template, allowing
// nested templates and links inside it.
function findListingTemplates(text: string): string[] {
  const templates: string[] = [];
  const start = /\{\{\s*(do|listing)\s*[|\n}]/gi;

  for (const match of text.matchAll(start)) {
    // Strip the outer "{{" and "}}".
    templates.push(findTemplateText(text, match.index ?? 0).slice(2, -2));
  }

  return templates;
}

// Splits "do | name=A | content=[[B|b]]" on pipes that aren't inside links or templates.
function splitParameters(body: string): Record<string, string> {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (let index = 0; index < body.length; index++) {
    const pair = body.slice(index, index + 2);

    if (pair === "{{" || pair === "[[") {
      depth++;
      current += pair;
      index++;
    } else if ((pair === "}}" || pair === "]]") && depth > 0) {
      depth--;
      current += pair;
      index++;
    } else if (body[index] === "|" && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += body[index];
    }
  }

  parts.push(current);

  const parameters: Record<string, string> = {};

  for (const part of parts.slice(1)) {
    const equals = part.indexOf("=");

    if (equals > 0) {
      parameters[part.slice(0, equals).trim().toLowerCase()] = part
        .slice(equals + 1)
        .trim();
    }
  }

  parameters.template = parts[0].trim().toLowerCase();

  return parameters;
}

// Wiki formatting to plain text: links, bold/italics, templates, references, HTML.
function toPlainText(wikitext: string): string {
  let text = wikitext
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[\s\S]*?<\/ref>/gi, "")
    .replace(/<[^>]+>/g, "");

  // Drop inline templates, innermost first.
  for (let pass = 0; pass < 5 && /\{\{[^{}]*\}\}/.test(text); pass++) {
    text = text.replace(/\{\{[^{}]*\}\}/g, "");
  }

  return text
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1")
    .replace(/\[https?:\/\/\S+\]/g, "")
    .replace(/'{2,}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCoordinate(value: string | undefined, limit: number) {
  const number = Number(value);

  return value && Number.isFinite(number) && Math.abs(number) <= limit
    ? number
    : undefined;
}

// "File:Colosseo 2020.jpg" or "Colosseo 2020.jpg" -> "Colosseo 2020.jpg".
function parseImageName(value: string | undefined): string | undefined {
  const name = value?.replace(/^(File|Image):/i, "").trim();

  return name &&
    /\.(jpe?g|png|webp|gif|tiff?)$/i.test(name) &&
    name.length < 240
    ? name
    : undefined;
}

function parseActivities(section: string): Activity[] {
  const activities: Activity[] = [];

  for (const template of findListingTemplates(section)) {
    const parameters = splitParameters(template);

    if (
      parameters.template === "listing" &&
      parameters.type?.toLowerCase() !== "do"
    ) {
      continue;
    }

    const name = toPlainText(parameters.name ?? "");

    if (!name) {
      continue;
    }

    const website = parameters.url?.trim();

    activities.push({
      name,
      description: toPlainText(parameters.content ?? ""),
      // Drop stray trailing punctuation, e.g. "Via XXIV Maggio 16,".
      address:
        toPlainText(parameters.address ?? "").replace(/[\s,;:]+$/, "") ||
        undefined,
      hours: toPlainText(parameters.hours ?? "") || undefined,
      price: toPlainText(parameters.price ?? "") || undefined,
      website: website && /^https?:\/\//.test(website) ? website : undefined,
      lat: parseCoordinate(parameters.lat, 90),
      lon: parseCoordinate(parameters.long, 180),
      wikidataId: /^Q\d+$/.test(parameters.wikidata ?? "")
        ? parameters.wikidata
        : undefined,
      image: parseImageName(parameters.image),
    });
  }

  return activities;
}

// The city's "Do" listings from its main and district pages. Returns an empty
// list when the city has no Wikivoyage page.
export async function getActivities(wikidataId: string): Promise<Activity[]> {
  const title = await getWikivoyageTitle(wikidataId);

  if (!title) {
    return [];
  }

  const activities = await getActivitiesFromPage(title);

  // Some cities link to a wider page, like "Tokyo (prefecture)"; the city
  // guide itself is then the page without the bracketed part.
  const baseTitle = title.replace(/\s*\(.*\)$/, "");

  if (activities.length === 0 && baseTitle !== title) {
    return getActivitiesFromPage(baseTitle);
  }

  return activities;
}

async function getActivitiesFromPage(title: string): Promise<Activity[]> {
  const main = await getWikitext(title);

  // A district page that fails to load just contributes nothing.
  const districts = await Promise.all(
    getDistrictTitles(title, main).map((district) =>
      getWikitext(district).catch(() => ""),
    ),
  );

  return [main, ...districts].flatMap((page) =>
    parseActivities(getSection(page, "Do")),
  );
}
