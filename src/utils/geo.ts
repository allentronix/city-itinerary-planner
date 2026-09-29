import type { Place } from "../data/types";

const EARTH_RADIUS_KM = 6371;
const WALKING_SPEED_KM_PER_HOUR = 4.5;
// Streets aren't straight lines; walking routes are roughly 30% longer.
const ROUTE_FACTOR = 1.3;

export type LocatedPlace = Place & { lat: number; lon: number };

export function hasCoordinates(place: Place): place is LocatedPlace {
  return place.lat !== undefined && place.lon !== undefined;
}

// Straight-line ("as the crow flies") distance between two places.
export function distanceKm(from: LocatedPlace, to: LocatedPlace): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latDelta = toRadians(to.lat - from.lat);
  const lonDelta = toRadians(to.lon - from.lon);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(lonDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export interface WalkEstimate {
  minutes: number;
  km: number;
}

// Estimated walk between two places, or null when either has no coordinates.
export function estimateWalk(from: Place, to: Place): WalkEstimate | null {
  if (!hasCoordinates(from) || !hasCoordinates(to)) {
    return null;
  }

  const km = distanceKm(from, to) * ROUTE_FACTOR;

  return {
    km,
    minutes: Math.max(1, Math.round((km / WALKING_SPEED_KM_PER_HOUR) * 60)),
  };
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
