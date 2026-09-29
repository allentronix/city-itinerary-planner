import cities from "../data/cities";
import type {
  City,
  CityInfo,
  ItineraryItem,
  Place,
  Schedule,
  Trip,
} from "../data/types";
import { daysBetween, getTodayDate, shiftDate } from "./dates";

const STORAGE_KEY = "itiplanner.trips";
const STORAGE_VERSION = 1;
const CHANGE_EVENT = "itiplanner:trips-changed";

// Built-in places are stored by id and looked up when a trip is opened, so later
// fixes to their details show up in saved trips too. Places from search cities
// also keep a copy, so reopening the trip needs no API request.
export interface SavedItineraryItem extends Schedule {
  id: string;
  placeId: string;
  place?: Place;
}

export interface SavedTrip extends Trip {
  id: string;
  // Optional name, e.g. "Rome with Mum"; otherwise the city name is shown.
  name?: string;
  items: SavedItineraryItem[];
  // Only set for cities found through search; built-in cities are looked up by cityId.
  city?: CityInfo;
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

// Creates the trip or updates the saved copy with the same id. Fields not
// passed in (like a trip's name) are kept.
export function saveTrip(
  trip: Omit<SavedTrip, "createdAt" | "updatedAt">,
): boolean {
  const trips = loadTrips();
  const existing = trips.find((saved) => saved.id === trip.id);
  const now = new Date().toISOString();

  const savedTrip: SavedTrip = {
    ...existing,
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

// An empty name removes it, so the city name shows again.
export function renameSavedTrip(id: string, name: string): boolean {
  const trimmed = name.trim();

  return writeTrips(
    loadTrips().map((trip) =>
      trip.id === id
        ? {
            ...trip,
            name: trimmed || undefined,
            updatedAt: new Date().toISOString(),
          }
        : trip,
    ),
  );
}

export function getTripDisplayName(trip: SavedTrip, city?: City): string {
  return trip.name || city?.name || "Trip";
}

// Activities keep their day of the trip: day 2 of the old dates becomes day 2
// of the new ones. Those that fall past the new end date are left out.
export function planDuplicate(
  trip: SavedTrip,
  startDate: string,
  endDate: string,
): { items: SavedItineraryItem[]; droppedCount: number } {
  const offset = daysBetween(trip.startDate, startDate);

  const items = trip.items
    .map((item) => ({ ...item, date: shiftDate(item.date, offset) }))
    .filter((item) => item.date >= startDate && item.date <= endDate);

  return { items, droppedCount: trip.items.length - items.length };
}

// Saves a copy of the trip on new dates and returns its id, or null if saving failed.
export function duplicateSavedTrip(
  trip: SavedTrip,
  startDate: string,
  endDate: string,
  name: string,
): string | null {
  const id = crypto.randomUUID();
  const { items } = planDuplicate(trip, startDate, endDate);

  const saved = saveTrip({
    id,
    cityId: trip.cityId,
    city: trip.city,
    name,
    startDate,
    endDate,
    items: items.map((item) => ({ ...item, id: crypto.randomUUID() })),
  });

  return saved ? id : null;
}

export function toSavedItems(
  itinerary: ItineraryItem[],
  city: City,
): SavedItineraryItem[] {
  return itinerary.map(({ place, ...schedule }) => ({
    ...schedule,
    placeId: place.id,
    // Built-in places are looked up by id; anything else (search cities,
    // things to do) keeps a copy so the trip reopens without the network.
    ...(city.source === "api" ||
    !city.places.some((builtIn) => builtIn.id === place.id)
      ? { place }
      : {}),
  }));
}

// The city copy saved with a trip; undefined for built-in cities.
export function toSavedCity(city: City): CityInfo | undefined {
  if (city.source !== "api") {
    return undefined;
  }

  const { id, name, country, lat, lon } = city;

  return { id, name, country, lat, lon };
}

// The city a saved trip belongs to: a built-in city, or the saved copy of a search city.
export function getTripCity(trip: SavedTrip): City | undefined {
  const builtIn = cities.find((city) => city.id === trip.cityId);

  if (builtIn) {
    return builtIn;
  }

  return trip.city ? { ...trip.city, places: [], source: "api" } : undefined;
}

// Rebuilds the itinerary, skipping places that no longer exist.
export function toItinerary(
  items: SavedItineraryItem[],
  city: City,
): { itinerary: ItineraryItem[]; missingCount: number } {
  const itinerary: ItineraryItem[] = [];

  for (const { placeId, place: savedPlace, ...schedule } of items) {
    const place =
      city.places.find((candidate) => candidate.id === placeId) ?? savedPlace;

    if (place) {
      itinerary.push({ ...schedule, place });
    }
  }

  return { itinerary, missingCount: items.length - itinerary.length };
}

export function isPastTrip(trip: Trip): boolean {
  return trip.endDate < getTodayDate();
}
