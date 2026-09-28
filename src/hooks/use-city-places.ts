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

// Places for a city. Built-in cities already have theirs; search cities load
// sights straight away and restaurants and cafés only when asked for.
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
      if (isApiCity) {
        requestPlaces(city, type);
      }
    },
    [city, isApiCity],
  );

  if (!isApiCity) {
    const ready: PlacesEntry = { status: "ready", places: city.places };

    return {
      places: city.places,
      entries: { sights: ready, restaurants: ready, cafes: ready },
      load,
    };
  }

  const entries = Object.fromEntries(
    PLACE_TYPES.map((type) => [type, getPlacesEntry(city.id, type)]),
  ) as Record<PlaceType, PlacesEntry | undefined>;

  const places = PLACE_TYPES.flatMap((type) => {
    const entry = entries[type];

    return entry?.status === "ready" ? entry.places : [];
  });

  return { places, entries, load };
}
