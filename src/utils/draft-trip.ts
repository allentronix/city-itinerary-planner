import type { City, CityInfo, ItineraryItem, Trip } from "../data/types";
import type { SavedItineraryItem } from "./saved-trips";

// The trip currently being planned but not yet saved, so a refresh or closed
// tab doesn't lose it. Only one draft is kept: starting a new plan replaces it.

const DRAFT_KEY = "itiplanner.draft";
const DRAFT_VERSION = 1;

export interface DraftTrip {
  version: typeof DRAFT_VERSION;
  city: CityInfo & { source?: "api" };
  trip: Trip;
  // Drafts always keep a copy of each place, so they restore without the network.
  items: SavedItineraryItem[];
  updatedAt: string;
}

export function loadDraft(): DraftTrip | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const draft = raw ? (JSON.parse(raw) as DraftTrip) : null;

    return draft?.version === DRAFT_VERSION ? draft : null;
  } catch {
    return null;
  }
}

export function saveDraft(city: City, trip: Trip, itinerary: ItineraryItem[]) {
  const { id, name, country, lat, lon, source } = city;

  const draft: DraftTrip = {
    version: DRAFT_VERSION,
    city: { id, name, country, lat, lon, source },
    trip,
    items: itinerary.map(({ place, ...schedule }) => ({
      ...schedule,
      placeId: place.id,
      place,
    })),
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked: planning still works, just without the draft.
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function isDraftFor(
  draft: DraftTrip | null,
  cityId: string,
): draft is DraftTrip {
  return draft?.city.id === cityId;
}
