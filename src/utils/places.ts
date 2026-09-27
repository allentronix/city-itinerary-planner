import type { Place } from "../data/types";

// Restaurants and cafés can be visited once per day; sights once per trip.
export function canVisitDaily(place: Place): boolean {
  return place.category !== "attraction";
}

// The trip days this place can't be scheduled on, given the days it's already booked.
export function getUnavailableDates(
  place: Place,
  bookedDates: string[],
  tripDates: string[],
): string[] {
  if (canVisitDaily(place)) {
    return bookedDates;
  }

  return bookedDates.length > 0 ? tripDates : [];
}
