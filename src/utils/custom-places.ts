import type { Place } from "../data/types";
import { getCloudSink } from "./cloud-sync";

// Places travellers add themselves, kept in this browser for each city, so
// they show up again in every trip to that city.

const STORAGE_KEY = "itiplanner.custom-places";
const STORAGE_VERSION = 1;
const CHANGE_EVENT = "itiplanner:custom-places-changed";

export const MAX_PLACE_NAME_LENGTH = 80;
export const MAX_PLACE_DESCRIPTION_LENGTH = 300;
export const MAX_PLACE_ADDRESS_LENGTH = 120;

// Places by city id.
export type CustomPlacesByCity = Record<string, Place[]>;

interface StoredCustomPlaces {
  version: typeof STORAGE_VERSION;
  places: CustomPlacesByCity;
}

const NO_PLACES: CustomPlacesByCity = {};

let cachedRaw: string | null | undefined;
let cachedPlaces: CustomPlacesByCity = NO_PLACES;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parsePlaces(raw: string | null): CustomPlacesByCity {
  if (!raw) {
    return NO_PLACES;
  }

  try {
    const data = JSON.parse(raw) as Partial<StoredCustomPlaces>;

    return data.version === STORAGE_VERSION &&
      data.places &&
      typeof data.places === "object"
      ? data.places
      : NO_PLACES;
  } catch {
    return NO_PLACES;
  }
}

// Returns the same object until storage changes, as useSyncExternalStore requires.
export function loadCustomPlaces(): CustomPlacesByCity {
  const raw = readRaw();

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPlaces = parsePlaces(raw);
  }

  return cachedPlaces;
}

export function getServerCustomPlaces(): CustomPlacesByCity {
  return NO_PLACES;
}

export function subscribeToCustomPlaces(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  // Keeps other open tabs in sync.
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeAllPlaces(all: CustomPlacesByCity): boolean {
  const data: StoredCustomPlaces = { version: STORAGE_VERSION, places: all };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    return false;
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));

  return true;
}

function writeCityPlaces(cityId: string, places: Place[]): boolean {
  const all = { ...loadCustomPlaces(), [cityId]: places };

  if (places.length === 0) {
    delete all[cityId];
  }

  return writeAllPlaces(all);
}

// Replaces this browser's copy with the account's, without sending it back.
export function replaceCustomPlaces(all: CustomPlacesByCity): boolean {
  return writeAllPlaces(all);
}

export type CustomPlaceFields = Pick<
  Place,
  "name" | "category" | "bestTime" | "description" | "address"
>;

// Trims the fields and drops empty optional ones.
function cleanFields(fields: CustomPlaceFields): CustomPlaceFields {
  return {
    name: fields.name.trim(),
    category: fields.category,
    bestTime: fields.bestTime,
    description: fields.description.trim(),
    address: fields.address?.trim() || undefined,
  };
}

// Returns the new place, or null if saving failed.
export function addCustomPlace(
  cityId: string,
  fields: CustomPlaceFields,
): Place | null {
  const place: Place = {
    // The prefix keeps custom ids apart from built-in and API place ids.
    id: `custom-${crypto.randomUUID()}`,
    ...cleanFields(fields),
    source: "custom",
  };

  const places = loadCustomPlaces()[cityId] ?? [];

  if (!writeCityPlaces(cityId, [...places, place])) {
    return null;
  }

  getCloudSink()?.saveCustomPlace(cityId, place);

  return place;
}

// Returns the updated place, or null if saving failed.
export function updateCustomPlace(
  cityId: string,
  place: Place,
  fields: CustomPlaceFields,
): Place | null {
  const updated: Place = { ...place, ...cleanFields(fields) };
  const places = loadCustomPlaces()[cityId] ?? [];

  if (
    !writeCityPlaces(
      cityId,
      places.map((existing) => (existing.id === place.id ? updated : existing)),
    )
  ) {
    return null;
  }

  getCloudSink()?.saveCustomPlace(cityId, updated);

  return updated;
}

export function deleteCustomPlace(cityId: string, placeId: string): boolean {
  const places = loadCustomPlaces()[cityId] ?? [];

  const deleted = writeCityPlaces(
    cityId,
    places.filter((place) => place.id !== placeId),
  );

  if (deleted) {
    getCloudSink()?.deleteCustomPlace(placeId);
  }

  return deleted;
}
