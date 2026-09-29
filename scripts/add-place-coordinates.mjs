// One-time script: adds lat/lon to the built-in places in src/data/cities.ts,
// so built-in cities get walking times and maps too. Free: sights come from
// Wikidata and restaurants/cafés from OpenStreetMap's Nominatim search. No
// Geoapify credits are used.
//
// Run with:  node --experimental-strip-types scripts/add-place-coordinates.mjs
// Add --write to save the coordinates; without it, the script only reports.

import { readFile, writeFile } from "node:fs/promises";

const CITIES_FILE = new URL("../src/data/cities.ts", import.meta.url);
const POPULAR_CITIES_FILE = new URL(
  "../netlify/lib/popular-cities.json",
  import.meta.url,
);

// Matches further than this from the city centre are rejected as wrong.
const MAX_DISTANCE_KM = 15;
// Nominatim's usage policy allows at most one request per second.
const NOMINATIM_DELAY_MS = 1100;

const HEADERS = {
  "User-Agent":
    "ItiPlanner/0.1 (https://github.com/allentronix/city-itinerary-planner)",
};

const shouldWrite = process.argv.includes("--write");

// Other names to try when a place's display name doesn't match the databases.
const ALIASES = {
  "szechenyi-baths": ["Széchenyi thermal bath", "Széchenyi Baths"],
  "tazza-doro": [
    "La Casa del Caffè Tazza d'Oro",
    "Tazza d'Oro Via degli Orfani",
  ],
  "big-ben": ["Big Ben", "Palace of Westminster"],
  venieros: ["Veniero's Pasticceria", "Veniero's"],
  "blue-bottle-kiyosumi": [
    "Blue Bottle Coffee Kiyosumi-Shirakawa",
    "Blue Bottle Coffee Kiyosumi",
  ],
  karamanlidika: ["Karamanlidika", "Karamanlidika tou Fani"],
  "taf-coffee": ["TAF Coffee", "Taf Coffee Roasters"],
};

const { default: cities } = await import(CITIES_FILE.href);
const popularCities = JSON.parse(await readFile(POPULAR_CITIES_FILE, "utf8"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function distanceKm(a, b) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(b.lat - a.lat);
  const lonDelta = toRadians(b.lon - a.lon);
  const h =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(lonDelta / 2) ** 2;

  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

// Wikidata: search the name, then take the first match with coordinates near the city.
async function findOnWikidata(name, center) {
  const search = new URL("https://www.wikidata.org/w/api.php");
  search.search = new URLSearchParams({
    action: "wbsearchentities",
    search: name,
    language: "en",
    limit: "7",
    format: "json",
  }).toString();

  const ids = ((await getJson(search)).search ?? []).map((result) => result.id);

  if (ids.length === 0) {
    return null;
  }

  const details = new URL("https://www.wikidata.org/w/api.php");
  details.search = new URLSearchParams({
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "claims",
    format: "json",
  }).toString();

  const entities = (await getJson(details)).entities ?? {};

  for (const id of ids) {
    const value = entities[id]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;

    if (value) {
      const point = { lat: value.latitude, lon: value.longitude };

      if (distanceKm(point, center) <= MAX_DISTANCE_KM) {
        return { ...point, source: `Wikidata ${id}` };
      }
    }
  }

  return null;
}

// Nominatim: search "name, city, country" and take the first match near the city.
async function findOnNominatim(name, city, center) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    q: `${name}, ${city.name}, ${city.country}`,
    format: "jsonv2",
    limit: "3",
  }).toString();

  await sleep(NOMINATIM_DELAY_MS);

  for (const result of await getJson(url)) {
    const point = { lat: Number(result.lat), lon: Number(result.lon) };

    if (distanceKm(point, center) <= MAX_DISTANCE_KM) {
      return { ...point, source: "OpenStreetMap" };
    }
  }

  return null;
}

async function locate(place, city, center) {
  const names = [place.name, ...(ALIASES[place.id] ?? [])];

  // Sights are usually on Wikidata; restaurants and cafés usually aren't.
  const lookups = names.flatMap((name) =>
    place.category === "attraction"
      ? [
          () => findOnWikidata(name, center),
          () => findOnNominatim(name, city, center),
        ]
      : [
          () => findOnNominatim(name, city, center),
          () => findOnWikidata(name, center),
        ],
  );

  for (const lookup of lookups) {
    try {
      const found = await lookup();

      if (found) {
        return found;
      }
    } catch (error) {
      console.error(`  ! ${place.name}: ${error.message}`);
    }
  }

  return null;
}

const found = new Map();
const missing = [];

for (const city of cities) {
  const popular = popularCities.find(
    (candidate) => candidate.name === city.name,
  );

  if (!popular) {
    console.log(`Skipping ${city.name}: no centre coordinates.`);
    continue;
  }

  console.log(`\n${city.name}`);

  for (const place of city.places) {
    const result = await locate(place, city, popular);

    if (result) {
      found.set(`${city.id}/${place.id}`, result);
      console.log(
        `  ✓ ${place.name} — ${distanceKm(result, popular).toFixed(1)} km from centre (${result.source})`,
      );
    } else {
      missing.push(`${city.name}: ${place.name}`);
      console.log(`  ✗ ${place.name} — not found`);
    }
  }
}

console.log(`\nFound ${found.size} of ${found.size + missing.length} places.`);

if (!shouldWrite) {
  console.log("Nothing written. Run again with --write to save.");
  process.exit(0);
}

// Insert lat/lon after each place's bestTime line, within its city's block.
let source = await readFile(CITIES_FILE, "utf8");

for (const [key, { lat, lon }] of found) {
  const [cityId, placeId] = key.split("/");
  const cityStart = source.indexOf(`    id: ${JSON.stringify(cityId)},`);
  const placeStart = source.indexOf(
    `        id: ${JSON.stringify(placeId)},`,
    cityStart,
  );
  const bestTimeLine = source.indexOf("        bestTime:", placeStart);
  const lineEnd = source.indexOf("\n", bestTimeLine);
  const blockEnd = source.indexOf("\n      },", placeStart);

  if (
    cityStart < 0 ||
    placeStart < 0 ||
    bestTimeLine < 0 ||
    bestTimeLine > blockEnd
  ) {
    console.error(`Couldn't find ${key} in cities.ts; skipped.`);
    continue;
  }

  // Skip places that already have coordinates.
  if (source.slice(placeStart, blockEnd).includes("        lat:")) {
    continue;
  }

  source = `${source.slice(0, lineEnd + 1)}        lat: ${lat.toFixed(5)},\n        lon: ${lon.toFixed(5)},\n${source.slice(lineEnd + 1)}`;
}

await writeFile(CITIES_FILE, source);
console.log("Saved coordinates to src/data/cities.ts.");
