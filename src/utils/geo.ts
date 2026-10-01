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

// Beyond this, people usually take transport rather than walk.
const LONGEST_WALK_MINUTES = 25;
// Door to door by metro, bus or taxi in a city: getting to a stop or waiting,
// then a typical average speed.
const TRANSIT_OVERHEAD_MINUTES = 8;
const TRANSIT_SPEED_KM_PER_HOUR = 20;

export interface TravelEstimate {
  mode: "walk" | "transit";
  minutes: number;
  km: number;
}

// How long getting from one place to the next probably takes: a walk when
// it's short, transit or a taxi when it isn't. Null without coordinates.
export function estimateTravel(from: Place, to: Place): TravelEstimate | null {
  const walk = estimateWalk(from, to);

  if (!walk) {
    return null;
  }

  if (walk.minutes <= LONGEST_WALK_MINUTES) {
    return { mode: "walk", ...walk };
  }

  return {
    mode: "transit",
    km: walk.km,
    minutes: Math.round(
      TRANSIT_OVERHEAD_MINUTES + (walk.km / TRANSIT_SPEED_KM_PER_HOUR) * 60,
    ),
  };
}

// Where a place is, as Google Maps understands it: coordinates, or the
// address for your own places.
function toMapsLocation(place: Place): string | null {
  if (hasCoordinates(place)) {
    return `${place.lat},${place.lon}`;
  }

  return place.address ? `${place.name}, ${place.address}` : null;
}

// Google Maps directions between two places (opens the app on phones).
export function getDirectionsUrl(
  from: Place,
  to: Place,
  mode: TravelEstimate["mode"] = "walk",
): string | null {
  const origin = toMapsLocation(from);
  const destination = toMapsLocation(to);

  if (!origin || !destination) {
    return null;
  }

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: mode === "walk" ? "walking" : "transit",
  });

  return `https://www.google.com/maps/dir/?${params}`;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
