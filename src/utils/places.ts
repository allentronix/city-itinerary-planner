import type { Place, PlaceCategory } from "../data/types";

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  attraction: "Sight",
  restaurant: "Restaurant",
  cafe: "Coffee shop",
  activity: "Thing to do",
};

// Restaurants and cafés can be visited once per day; sights and things to do once per trip.
export function canVisitDaily(place: Place): boolean {
  return place.category === "restaurant" || place.category === "cafe";
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
