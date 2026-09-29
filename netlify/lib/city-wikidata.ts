import { callGeoapify, THIRTY_DAYS_MS, withCache } from "./geoapify";
import { reserveCredits } from "./usage";

// A city's Wikidata id (e.g. "Q597" for Lisbon), found from its Geoapify
// place id. Costs about one Geoapify credit per city, once; shared by the
// city photo and "Things to do" lookups.

const CACHE_VERSION = 1;

interface GeoapifyPlaceDetails {
  features?: {
    properties: {
      wiki_and_media?: { wikidata?: string };
      datasource?: { raw?: { wikidata?: string } };
    };
  }[];
}

export function isWikidataId(
  value: string | null | undefined,
): value is string {
  return Boolean(value && /^Q\d+$/.test(value));
}

export async function getCityWikidataId(
  cityId: string,
  visitorIp: string,
): Promise<string | null> {
  return withCache(
    `city-wikidata:v${CACHE_VERSION}:${cityId}`,
    THIRTY_DAYS_MS,
    async () => {
      await reserveCredits(visitorIp, 1);

      const details = await callGeoapify<GeoapifyPlaceDetails>(
        "/v2/place-details",
        { id: cityId, features: "details" },
      );

      const properties = details.features?.[0]?.properties;
      const id =
        properties?.wiki_and_media?.wikidata ??
        properties?.datasource?.raw?.wikidata;

      return isWikidataId(id) ? id : null;
    },
  );
}
