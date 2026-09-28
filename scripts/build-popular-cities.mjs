// One-time script: looks up popular cities on Geoapify and saves them, so
// searching these cities in the app never uses API credits.
//
// Run with: node --env-file=.env scripts/build-popular-cities.mjs
// Uses about one credit per city.

import { writeFile } from "node:fs/promises";

const CITIES = [
  // Europe
  "London, United Kingdom",
  "Paris, France",
  "Rome, Italy",
  "Barcelona, Spain",
  "Madrid, Spain",
  "Seville, Spain",
  "Valencia, Spain",
  "Lisbon, Portugal",
  "Porto, Portugal",
  "Amsterdam, Netherlands",
  "Brussels, Belgium",
  "Berlin, Germany",
  "Munich, Germany",
  "Hamburg, Germany",
  "Vienna, Austria",
  "Prague, Czech Republic",
  "Budapest, Hungary",
  "Warsaw, Poland",
  "Krakow, Poland",
  "Copenhagen, Denmark",
  "Stockholm, Sweden",
  "Oslo, Norway",
  "Helsinki, Finland",
  "Dublin, Ireland",
  "Edinburgh, United Kingdom",
  "Zurich, Switzerland",
  "Geneva, Switzerland",
  "Milan, Italy",
  "Venice, Italy",
  "Florence, Italy",
  "Naples, Italy",
  "Athens, Greece",
  "Istanbul, Turkey",
  "Dubrovnik, Croatia",
  "Nice, France",
  "Lyon, France",
  "Reykjavik, Iceland",
  "Bruges, Belgium",
  "Salzburg, Austria",
  "Tallinn, Estonia",
  // Americas
  "New York, United States",
  "Los Angeles, United States",
  "San Francisco, United States",
  "Chicago, United States",
  "Las Vegas, United States",
  "Miami, United States",
  "Washington, United States",
  "Boston, United States",
  "New Orleans, United States",
  "Seattle, United States",
  "Toronto, Canada",
  "Vancouver, Canada",
  "Montreal, Canada",
  "Mexico City, Mexico",
  "Cancun, Mexico",
  "Havana, Cuba",
  "Rio de Janeiro, Brazil",
  "Sao Paulo, Brazil",
  "Buenos Aires, Argentina",
  "Lima, Peru",
  "Cusco, Peru",
  "Bogota, Colombia",
  "Cartagena, Colombia",
  "Santiago, Chile",
  // Asia
  "Tokyo, Japan",
  "Kyoto, Japan",
  "Osaka, Japan",
  "Seoul, South Korea",
  "Beijing, China",
  "Shanghai, China",
  "Hong Kong, China",
  "Taipei, Taiwan",
  "Singapore, Singapore",
  "Bangkok, Thailand",
  "Chiang Mai, Thailand",
  "Phuket, Thailand",
  "Hanoi, Vietnam",
  "Ho Chi Minh City, Vietnam",
  "Kuala Lumpur, Malaysia",
  "Denpasar, Indonesia",
  "Jakarta, Indonesia",
  "Manila, Philippines",
  "Delhi, India",
  "Mumbai, India",
  "Jaipur, India",
  "Kathmandu, Nepal",
  "Dubai, United Arab Emirates",
  "Abu Dhabi, United Arab Emirates",
  "Doha, Qatar",
  "Jerusalem, Israel",
  "Tel Aviv, Israel",
  // Africa
  "Cairo, Egypt",
  "Marrakesh, Morocco",
  "Cape Town, South Africa",
  "Johannesburg, South Africa",
  "Nairobi, Kenya",
  "Lagos, Nigeria",
  "Accra, Ghana",
  "Zanzibar City, Tanzania",
  // Oceania
  "Sydney, Australia",
  "Melbourne, Australia",
  "Brisbane, Australia",
  "Auckland, New Zealand",
  "Queenstown, New Zealand",
];

const OUTPUT = new URL("../netlify/lib/popular-cities.json", import.meta.url);

const apiKey = process.env.GEOAPIFY_API_KEY;

if (!apiKey) {
  console.error("GEOAPIFY_API_KEY is missing. Add it to .env first.");
  process.exit(1);
}

// Retries brief network errors a couple of times.
async function fetchWithRetry(url, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (attempt >= attempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function lookUp(query) {
  const url = new URL("https://api.geoapify.com/v1/geocode/search");
  url.search = new URLSearchParams({
    text: query,
    type: "city",
    limit: "1",
    format: "json",
    apiKey,
  }).toString();

  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`${query}: HTTP ${response.status}`);
  }

  const [result] = (await response.json()).results ?? [];

  if (!result) {
    throw new Error(`${query}: no match`);
  }

  // Show the familiar name from the list above ("London", not "Greater London").
  return {
    id: result.place_id,
    name: query.split(",")[0],
    country: result.country,
    countryCode: result.country_code,
    lat: result.lat,
    lon: result.lon,
  };
}

const cities = [];
const failures = [];

for (const query of CITIES) {
  try {
    cities.push(await lookUp(query));
  } catch (error) {
    failures.push(`${query}: ${error.message}`);
  }

  // Stay well under Geoapify's per-second limit.
  await new Promise((resolve) => setTimeout(resolve, 250));
}

await writeFile(OUTPUT, `${JSON.stringify(cities, null, 2)}\n`);

console.log(`Saved ${cities.length} of ${CITIES.length} cities.`);

if (failures.length > 0) {
  console.log("Failed:", failures);
}
