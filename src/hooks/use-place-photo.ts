import { useEffect, useSyncExternalStore } from "react";
import type { Place } from "../data/types";
import {
  getPhotoKey,
  getPlacePhoto,
  getPlacePhotosVersion,
  isPhotoLookupDone,
  requestPlacePhoto,
  subscribeToPlacePhotos,
  type PlacePhoto,
} from "../utils/place-photos";

export type PlacePhotoState =
  | { status: "loading" }
  | { status: "ready"; photo: PlacePhoto }
  // No photo source, no photo found, or the lookup failed.
  | { status: "none" };

export function usePlacePhoto(place: Place): PlacePhotoState {
  const key = getPhotoKey(place);

  useSyncExternalStore(
    subscribeToPlacePhotos,
    getPlacePhotosVersion,
    getPlacePhotosVersion,
  );

  useEffect(() => {
    if (key) {
      requestPlacePhoto(key);
    }
  }, [key]);

  if (!key) {
    return { status: "none" };
  }

  const photo = getPlacePhoto(key);

  if (photo) {
    return { status: "ready", photo };
  }

  return isPhotoLookupDone(key) ? { status: "none" } : { status: "loading" };
}
