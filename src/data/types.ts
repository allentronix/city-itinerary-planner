export interface Place {
    id: string;
    name: string;
    description: string;
    bestTime: string;
  }
  
  export interface City {
    id: string;
    name: string;
    country: string;
    places: Place[];
  }
  
  export interface ItineraryItem {
    place: Place;
    date: string;
    startTime: string;
    duration: number;
  }
  export interface Trip {
    cityId: string;
    startDate: string;
    endDate: string;
  }