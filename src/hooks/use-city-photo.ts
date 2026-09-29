import { useEffect, useSyncExternalStore } from "react";
import type { City } from "../data/types";
import {
  getCityPhoto,
  getPlacesVersion,
  requestCityPhoto,
  subscribeToPlaces,
} from "../utils/api";

export interface CityPhotoInfo {
  url: string;
  // Full credit line, e.g. "Ervin Lukacs / Unsplash".
  credit: string;
}

// The photo for a city: built-in cities have their own, and cities found
// through search get one from Wikimedia Commons when available.
export function useCityPhoto(city: City | undefined): CityPhotoInfo | null {
  const needsLookup = Boolean(city && !city.image && city.source === "api");

  // Re-render when the shared API store changes.
  useSyncExternalStore(subscribeToPlaces, getPlacesVersion, getPlacesVersion);

  useEffect(() => {
    if (city && needsLookup) {
      requestCityPhoto(city.id);
    }
  }, [city, needsLookup]);

  if (!city) {
    return null;
  }

  if (city.image) {
    return {
      url: city.image,
      credit: city.photoCredit ? `${city.photoCredit} / Unsplash` : "",
    };
  }

  const photo = needsLookup ? getCityPhoto(city.id) : null;

  return photo
    ? { url: photo.url, credit: `${photo.credit} / Wikimedia Commons` }
    : null;
}
