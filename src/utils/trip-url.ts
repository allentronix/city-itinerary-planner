import cities from "../data/cities";
import type { CityInfo, Trip } from "../data/types";

export function isBuiltInCity(cityId: string): boolean {
  return cities.some((city) => city.id === cityId);
}

// Query string for a new trip's planner. Cities found through search also
// carry their details, since the app has no other record of them.
export function getTripSearchParams(
  city: CityInfo,
  trip: Pick<Trip, "startDate" | "endDate">,
): URLSearchParams {
  const params = new URLSearchParams({
    start: trip.startDate,
    end: trip.endDate,
  });

  if (!isBuiltInCity(city.id)) {
    params.set("name", city.name);
    params.set("country", city.country);

    if (city.lat !== undefined && city.lon !== undefined) {
      params.set("lat", String(city.lat));
      params.set("lon", String(city.lon));
    }
  }

  return params;
}

export function getTripUrl(
  city: CityInfo,
  trip: Pick<Trip, "startDate" | "endDate">,
): string {
  return `/city/${city.id}?${getTripSearchParams(city, trip)}`;
}
