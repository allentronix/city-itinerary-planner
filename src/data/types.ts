export type PlaceCategory = "attraction" | "restaurant" | "cafe";

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  description: string;
  bestTime: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  image: string;
  photoCredit: string;
  places: Place[];
}

export interface Schedule {
  date: string;
  startTime: string;
  duration: number;
  travelTime: number;
}

export interface ItineraryItem extends Schedule {
  id: string;
  place: Place;
}

export interface Trip {
  cityId: string;
  startDate: string;
  endDate: string;
}
