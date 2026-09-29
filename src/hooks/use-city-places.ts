import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { City, Place } from "../data/types";
import {
  getPlacesEntry,
  getPlacesVersion,
  PLACE_TYPES,
  requestPlaces,
  subscribeToPlaces,
  type PlaceType,
  type PlacesEntry,
} from "../utils/api";

interface CityPlaces {
  places: Place[];
  // Status of each type; undefined means not requested yet.
  entries: Record<PlaceType, PlacesEntry | undefined>;
  load: (type: PlaceType) => void;
}

// The types built-in cities ship with; "Things to do" always comes from the API.
const BUILT_IN_TYPES: PlaceType[] = ["sights", "restaurants", "cafes"];

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Places for a city. Built-in cities have their sights, restaurants and cafés
// already; search cities load sights straight away. Everything else, including
// "Things to do", loads only when asked for.
export function useCityPlaces(city: City): CityPlaces {
  const isApiCity = city.source === "api";

  // Re-render whenever the shared places store changes.
  useSyncExternalStore(subscribeToPlaces, getPlacesVersion, getPlacesVersion);

  useEffect(() => {
    if (isApiCity) {
      requestPlaces(city, "sights");
    }
  }, [city, isApiCity]);

  const load = useCallback(
    (type: PlaceType) => {
      if (isApiCity || !BUILT_IN_TYPES.includes(type)) {
        requestPlaces(city, type);
      }
    },
    [city, isApiCity],
  );

  const builtInReady: PlacesEntry = { status: "ready", places: city.places };

  const entries = Object.fromEntries(
    PLACE_TYPES.map((type) => [
      type,
      !isApiCity && BUILT_IN_TYPES.includes(type)
        ? builtInReady
        : getPlacesEntry(city.id, type),
    ]),
  ) as Record<PlaceType, PlacesEntry | undefined>;

  const basePlaces = isApiCity
    ? BUILT_IN_TYPES.flatMap((type) => {
        const entry = entries[type];

        return entry?.status === "ready" ? entry.places : [];
      })
    : city.places;

  // Skip things to do that are already listed as a sight, restaurant or café.
  const knownNames = new Set(
    basePlaces.map((place) => normalizeName(place.name)),
  );
  const activities =
    entries.activities?.status === "ready"
      ? entries.activities.places.filter(
          (place) => !knownNames.has(normalizeName(place.name)),
        )
      : [];

  return { places: [...basePlaces, ...activities], entries, load };
}
