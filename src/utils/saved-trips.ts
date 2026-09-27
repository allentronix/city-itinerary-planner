import type { City, ItineraryItem, Schedule, Trip } from "../data/types";
import { getTodayDate } from "./dates";

const STORAGE_KEY = "itiplanner.trips";
const STORAGE_VERSION = 1;
const CHANGE_EVENT = "itiplanner:trips-changed";

// Places are stored by id and looked up from the city data when a trip is opened,
// so later fixes to place details show up in saved trips too.
export interface SavedItineraryItem extends Schedule {
  id: string;
  placeId: string;
}

export interface SavedTrip extends Trip {
  id: string;
  items: SavedItineraryItem[];
  createdAt: string;
  updatedAt: string;
}

interface StoredTrips {
  version: typeof STORAGE_VERSION;
  trips: SavedTrip[];
}

const NO_TRIPS: SavedTrip[] = [];

let cachedRaw: string | null | undefined;
let cachedTrips: SavedTrip[] = NO_TRIPS;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseTrips(raw: string | null): SavedTrip[] {
  if (!raw) {
    return NO_TRIPS;
  }

  try {
    const data = JSON.parse(raw) as Partial<StoredTrips>;

    return data.version === STORAGE_VERSION && Array.isArray(data.trips)
      ? data.trips
      : NO_TRIPS;
  } catch {
    return NO_TRIPS;
  }
}

// Returns the same array until storage changes, as useSyncExternalStore requires.
export function loadTrips(): SavedTrip[] {
  const raw = readRaw();

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTrips = parseTrips(raw);
  }

  return cachedTrips;
}

export function getServerTrips(): SavedTrip[] {
  return NO_TRIPS;
}

export function subscribeToTrips(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  // Keeps other open tabs in sync.
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeTrips(trips: SavedTrip[]): boolean {
  const data: StoredTrips = { version: STORAGE_VERSION, trips };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    return false;
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));

  return true;
}

export function getSavedTrip(id: string): SavedTrip | undefined {
  return loadTrips().find((trip) => trip.id === id);
}

// Creates the trip or replaces the saved copy with the same id.
export function saveTrip(
  trip: Omit<SavedTrip, "createdAt" | "updatedAt">,
): boolean {
  const trips = loadTrips();
  const existing = trips.find((saved) => saved.id === trip.id);
  const now = new Date().toISOString();

  const savedTrip: SavedTrip = {
    ...trip,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return writeTrips(
    existing
      ? trips.map((saved) => (saved.id === trip.id ? savedTrip : saved))
      : [...trips, savedTrip],
  );
}

export function deleteSavedTrip(id: string): boolean {
  return writeTrips(loadTrips().filter((trip) => trip.id !== id));
}

export function toSavedItems(itinerary: ItineraryItem[]): SavedItineraryItem[] {
  return itinerary.map(({ place, ...schedule }) => ({
    ...schedule,
    placeId: place.id,
  }));
}

// Rebuilds the itinerary, skipping places that no longer exist in the city data.
export function toItinerary(
  items: SavedItineraryItem[],
  city: City,
): { itinerary: ItineraryItem[]; missingCount: number } {
  const itinerary: ItineraryItem[] = [];

  for (const { placeId, ...schedule } of items) {
    const place = city.places.find((candidate) => candidate.id === placeId);

    if (place) {
      itinerary.push({ ...schedule, place });
    }
  }

  return { itinerary, missingCount: items.length - itinerary.length };
}

export function isPastTrip(trip: Trip): boolean {
  return trip.endDate < getTodayDate();
}
