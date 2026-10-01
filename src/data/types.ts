export type PlaceCategory = "attraction" | "restaurant" | "cafe" | "activity";

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  description: string;
  bestTime: string;
  // Only set for places loaded from the places API.
  address?: string;
  lat?: number;
  lon?: number;
  openingHours?: string;
  website?: string;
  // Added by the traveller and kept in this browser. Has the same shape as
  // other places, so it can later be sent in as a suggestion for everyone.
  source?: "custom";
}

// The basics of a city: what city search returns and saved trips keep a copy of.
export interface CityInfo {
  id: string;
  name: string;
  country: string;
  lat?: number;
  lon?: number;
}

export interface City extends CityInfo {
  image?: string;
  photoCredit?: string;
  // Built-in cities ship with their places. Cities found through search
  // ("api") start empty and load their places from /api/places.
  places: Place[];
  source?: "api";
  // Lets built-in cities load "Things to do" without a Geoapify lookup.
  wikidataId?: string;
}

export interface Schedule {
  date: string;
  startTime: string;
  duration: number;
  // Minutes to reach the next stop, set by hand; 0 means use the estimate
  // from the places' locations (or none, when they have no coordinates).
  travelTime: number;
}

export interface ItineraryItem extends Schedule {
  id: string;
  place: Place;
  // The traveller's own note, e.g. "Tickets booked, ref ABC123".
  note?: string;
}

export interface Trip {
  cityId: string;
  startDate: string;
  endDate: string;
}
