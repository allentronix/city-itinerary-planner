import { useSyncExternalStore } from "react";
import {
  getServerTrips,
  loadTrips,
  subscribeToTrips,
  type SavedTrip,
} from "../utils/saved-trips";

// Saved trips that stay up to date when they change, including from other tabs.
export function useSavedTrips(): SavedTrip[] {
  return useSyncExternalStore(subscribeToTrips, loadTrips, getServerTrips);
}
