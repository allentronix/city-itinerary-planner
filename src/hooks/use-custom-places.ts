import { useSyncExternalStore } from "react";
import type { Place } from "../data/types";
import {
  getServerCustomPlaces,
  loadCustomPlaces,
  subscribeToCustomPlaces,
} from "../utils/custom-places";

const NO_PLACES: Place[] = [];

// The traveller's own places for a city, kept up to date across tabs.
export function useCustomPlaces(cityId: string): Place[] {
  const all = useSyncExternalStore(
    subscribeToCustomPlaces,
    loadCustomPlaces,
    getServerCustomPlaces,
  );

  return all[cityId] ?? NO_PLACES;
}
