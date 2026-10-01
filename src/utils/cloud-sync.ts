import type { Place } from "../data/types";
import type { SavedTrip } from "./saved-trips";

// Where local changes are sent while someone is signed in. Set by the Firebase
// session once it has loaded, so the storage modules never import Firebase.
export interface CloudSink {
  saveTrip: (trip: SavedTrip) => void;
  deleteTrip: (tripId: string) => void;
  saveCustomPlace: (cityId: string, place: Place) => void;
  deleteCustomPlace: (placeId: string) => void;
}

let sink: CloudSink | null = null;

export function setCloudSink(next: CloudSink | null) {
  sink = next;
}

export function getCloudSink(): CloudSink | null {
  return sink;
}
