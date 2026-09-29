import { useEffect, useRef, useState } from "react";

import {
  Link,
  useBlocker,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import type {
  City,
  ItineraryItem,
  Place,
  PlaceCategory,
  Schedule,
  Trip,
} from "../data/types";

import PlaceCard from "./place-card";

import Itinerary from "./itinerary";

import TripForm from "./trip-form";

import { Button } from "./ui/button";

import PageBanner from "./page-banner";

import { getTimeOfDay, type TimeOfDay } from "../utils/best-time";

import { formatFullDate, getTripDates } from "../utils/dates";

import { canVisitDaily, getUnavailableDates } from "../utils/places";

import { saveTrip, toSavedCity, toSavedItems } from "../utils/saved-trips";

import {
  clearDraft,
  isDraftFor,
  loadDraft,
  saveDraft,
} from "../utils/draft-trip";

import { getTripSearchParams } from "../utils/trip-url";

import { PLACE_TYPES, type PlaceType } from "../utils/api";

import { useCityPlaces } from "../hooks/use-city-places";

import { useCityPhoto } from "../hooks/use-city-photo";

import {
  isWithinSameDay,
  timeToMinutes,
  toTravelTimeOption,
} from "../utils/time";

import { estimateWalk } from "../utils/geo";

type PlaceFilter = "all" | "not-added" | PlaceCategory | TimeOfDay;

const PLACE_FILTERS: { value: PlaceFilter; label: string }[] = [
  { value: "all", label: "All places" },
  { value: "not-added", label: "Not added yet" },
  { value: "attraction", label: "Sights" },
  { value: "restaurant", label: "Restaurants" },
  { value: "cafe", label: "Coffee shops" },
  { value: "morning", label: "Morning spots" },
  { value: "afternoon", label: "Afternoon spots" },
  { value: "evening", label: "Evening spots" },
];

// Filters that show only one kind of place, and the kind they need loaded.
const FILTER_PLACE_TYPES: Partial<Record<PlaceFilter, PlaceType[]>> = {
  attraction: ["sights"],
  restaurant: ["restaurants"],
  cafe: ["cafes"],
};

const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  sights: "sights",
  restaurants: "restaurants",
  cafes: "coffee shops",
};

const PLACE_TYPE_BUTTON_LABELS: Record<PlaceType, string> = {
  sights: "Sights",
  restaurants: "Restaurants",
  cafes: "Coffee shops",
};

interface PlannerProps {
  city: City;
  initialTrip: Trip | null;
  initialItinerary?: ItineraryItem[];
  savedTripId?: string;
  notice?: string;
  // A saved trip's own name, e.g. "Rome with Mum".
  tripName?: string;
}

function Planner({
  city,
  initialTrip,
  initialItinerary = [],
  savedTripId,
  notice,
  tripName,
}: PlannerProps) {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialItinerary);

  const [trip, setTrip] = useState<Trip | null>(initialTrip);

  const [isEditingTrip, setIsEditingTrip] = useState(false);

  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>("all");

  const {
    places,
    entries: placeEntries,
    load: loadPlaces,
  } = useCityPlaces(city);

  const isApiCity = city.source === "api";

  const photo = useCityPhoto(city);

  const [saveError, setSaveError] = useState("");

  // Set while saving a new trip, so the unsaved-changes warning doesn't fire on the redirect.
  const isSavingRef = useRef(false);

  const hasUnsavedWork = !savedTripId && itinerary.length > 0;

  // What was last written to storage, so opening a trip doesn't count as a change.
  const lastSavedRef = useRef(
    JSON.stringify({
      trip: initialTrip,
      items: toSavedItems(initialItinerary, city),
    }),
  );

  // Once a trip is saved, every change to it is saved automatically.
  useEffect(() => {
    if (!savedTripId || !trip) {
      return;
    }

    const items = toSavedItems(itinerary, city);
    const snapshot = JSON.stringify({ trip, items });

    if (snapshot === lastSavedRef.current) {
      return;
    }

    const saved = saveTrip({
      ...trip,
      id: savedTripId,
      items,
      city: toSavedCity(city),
    });

    if (saved) {
      lastSavedRef.current = snapshot;
    }

    setSaveError(saved ? "" : "Couldn't save your latest changes.");
  }, [savedTripId, trip, itinerary, city]);

  // Keep an unsaved trip as a draft, so a refresh or closed tab doesn't lose it.
  useEffect(() => {
    if (savedTripId || !trip) {
      return;
    }

    if (itinerary.length > 0) {
      saveDraft(city, trip, itinerary);
    } else if (isDraftFor(loadDraft(), city.id)) {
      // Everything was removed: drop this city's draft, but never another city's.
      clearDraft();
    }
  }, [savedTripId, trip, itinerary, city]);

  // Keep the URL's dates in step with an unsaved trip, so a refresh reopens the same dates.
  useEffect(() => {
    if (savedTripId || !trip) {
      return;
    }

    if (
      searchParams.get("start") !== trip.startDate ||
      searchParams.get("end") !== trip.endDate
    ) {
      setSearchParams(getTripSearchParams(city, trip), { replace: true });
    }
  }, [savedTripId, trip, city, searchParams, setSearchParams]);

  // Warn before moving to another page in the app with an unsaved trip.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedWork &&
      !isSavingRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }

    if (
      window.confirm(
        "This trip isn't saved yet. It's kept as a draft, but planning another trip will replace it. Leave this page?",
      )
    ) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  function handleSaveTrip() {
    if (!trip) {
      return;
    }

    const id = crypto.randomUUID();

    const saved = saveTrip({
      ...trip,
      id,
      items: toSavedItems(itinerary, city),
      city: toSavedCity(city),
    });

    if (!saved) {
      setSaveError(
        "Couldn't save this trip. Your browser may be blocking storage.",
      );
      return;
    }

    clearDraft();
    isSavingRef.current = true;
    navigate(`/trips/${id}`, { replace: true });
  }

  function isPlaceAdded(placeId: string): boolean {
    return itinerary.some((item) => item.place.id === placeId);
  }

  function getBookedDates(placeId: string, excludeItemId?: string): string[] {
    return itinerary
      .filter((item) => item.place.id === placeId && item.id !== excludeItemId)
      .map((item) => item.date);
  }

  function getUnavailableDatesFor(
    place: Place,
    excludeItemId?: string,
  ): string[] {
    if (!trip) {
      return [];
    }

    return getUnavailableDates(
      place,
      getBookedDates(place.id, excludeItemId),
      getTripDates(trip.startDate, trip.endDate),
    );
  }

  function getRepeatVisitError(
    place: Place,
    date: string,
    excludeItemId?: string,
  ): string | null {
    if (!getUnavailableDatesFor(place, excludeItemId).includes(date)) {
      return null;
    }

    return canVisitDaily(place)
      ? `${place.name} is already planned for that day.`
      : `${place.name} is already in your itinerary.`;
  }

  function matchesFilter(place: Place): boolean {
    if (placeFilter === "all") {
      return true;
    }

    if (placeFilter === "not-added") {
      return !isPlaceAdded(place.id);
    }

    if (
      placeFilter === "attraction" ||
      placeFilter === "restaurant" ||
      placeFilter === "cafe"
    ) {
      return place.category === placeFilter;
    }

    return getTimeOfDay(place.bestTime) === placeFilter;
  }

  function findTimeClash(
    schedule: Schedule,
    excludeItemId?: string,
  ): ItineraryItem | null {
    const newStart = timeToMinutes(schedule.startTime);

    const newEnd = newStart + schedule.duration + schedule.travelTime;

    const conflict = itinerary.find((item) => {
      if (item.id === excludeItemId) {
        return false;
      }

      if (item.date !== schedule.date) {
        return false;
      }

      const existingStart = timeToMinutes(item.startTime);

      const existingEnd = existingStart + item.duration + item.travelTime;

      return newStart < existingEnd && newEnd > existingStart;
    });

    return conflict ?? null;
  }

  function getScheduleError(
    schedule: Schedule,
    excludeItemId?: string,
  ): string | null {
    if (
      !isWithinSameDay(
        schedule.startTime,
        schedule.duration + schedule.travelTime,
      )
    ) {
      return "This activity and its travel time would run past midnight. Please choose an earlier start time or shorter duration.";
    }

    const conflict = findTimeClash(schedule, excludeItemId);

    if (conflict) {
      return `This time overlaps with ${conflict.place.name}.`;
    }

    return null;
  }

  function isTimeAvailable(
    schedule: Schedule,
    excludeItemId?: string,
  ): boolean {
    return getScheduleError(schedule, excludeItemId) === null;
  }

  // Travel time from this place to the next stop that day, from walking distance.
  function suggestTravelTime(place: Place, schedule: Schedule): number {
    const start = timeToMinutes(schedule.startTime);

    const nextStop = itinerary
      .filter(
        (item) =>
          item.date === schedule.date && timeToMinutes(item.startTime) > start,
      )
      .sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
      )[0];

    const walk = nextStop ? estimateWalk(place, nextStop.place) : null;

    return walk ? toTravelTimeOption(walk.minutes) : 0;
  }

  function handleAddPlace(place: Place, schedule: Schedule): string | null {
    const error =
      getRepeatVisitError(place, schedule.date) ?? getScheduleError(schedule);

    if (error) {
      return error;
    }

    setItinerary((current) => [
      ...current,
      { id: crypto.randomUUID(), place, ...schedule },
    ]);

    return null;
  }

  function handleEditItem(
    item: ItineraryItem,
    schedule: Schedule,
  ): string | null {
    const error =
      getRepeatVisitError(item.place, schedule.date, item.id) ??
      getScheduleError(schedule, item.id);

    if (error) {
      return error;
    }

    setItinerary((current) =>
      current.map((existing) =>
        existing.id === item.id ? { ...existing, ...schedule } : existing,
      ),
    );

    return null;
  }

  const visiblePlaces = places.filter(matchesFilter);

  // Which kinds of place the current filter shows, and where each stands.
  const filteredTypes: PlaceType[] =
    FILTER_PLACE_TYPES[placeFilter] ?? PLACE_TYPES;
  const loadingTypes = filteredTypes.filter(
    (type) => placeEntries[type]?.status === "loading",
  );
  const failedTypes = filteredTypes.filter(
    (type) => placeEntries[type]?.status === "error",
  );
  const notLoadedTypes = isApiCity
    ? filteredTypes.filter((type) => !placeEntries[type])
    : [];

  function handleFilterChange(filter: PlaceFilter) {
    setPlaceFilter(filter);

    // Restaurants and cafés load only when someone asks for them.
    FILTER_PLACE_TYPES[filter]?.forEach(loadPlaces);
  }

  const tripDayCount = trip
    ? getTripDates(trip.startDate, trip.endDate).length
    : 0;

  return (
    <>
      <PageBanner
        eyebrow={
          tripName
            ? [city.name, city.country].filter(Boolean).join(", ")
            : city.country
        }
        title={tripName || city.name}
        image={photo?.url}
        photoCredit={photo?.credit}
      >
        {trip && !isEditingTrip && (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-white/90">
              {formatFullDate(trip.startDate)} – {formatFullDate(trip.endDate)}
              <span className="text-white/60">
                {" "}
                · {tripDayCount} {tripDayCount === 1 ? "day" : "days"}
              </span>
            </p>

            <Button
              size="sm"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white hover:text-slate-900"
              onClick={() => setIsEditingTrip(true)}
            >
              Edit trip
            </Button>
          </div>
        )}
      </PageBanner>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {notice && (
          <p className="mb-8 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {notice}
          </p>
        )}

        {(!trip || isEditingTrip) && (
          <TripForm
            cityName={city.name}
            initialStartDate={trip?.startDate}
            initialEndDate={trip?.endDate}
            onCreateTrip={(startDate, endDate) => {
              const affectedItems = itinerary.filter(
                (item) => item.date < startDate || item.date > endDate,
              );

              if (affectedItems.length > 0) {
                const confirmed = window.confirm(
                  `${affectedItems.length} itinerary ${
                    affectedItems.length === 1 ? "item is" : "items are"
                  } outside your new trip dates and will be removed. Continue?`,
                );

                if (!confirmed) {
                  return;
                }
              }

              setTrip({
                cityId: city.id,
                startDate,
                endDate,
              });

              setItinerary((current) =>
                current.filter(
                  (item) => item.date >= startDate && item.date <= endDate,
                ),
              );

              setIsEditingTrip(false);
            }}
            onCancel={trip ? () => setIsEditingTrip(false) : undefined}
          />
        )}

        {trip ? (
          <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
            <section>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-serif text-3xl tracking-tight">
                  Places to visit
                </h2>

                <div>
                  <label
                    className="block text-xs font-medium tracking-wider text-slate-500 uppercase"
                    htmlFor="place-filter"
                  >
                    Show
                  </label>
                  <select
                    id="place-filter"
                    value={placeFilter}
                    onChange={(event) =>
                      handleFilterChange(event.target.value as PlaceFilter)
                    }
                    className="mt-1 border bg-white p-2 text-sm"
                  >
                    {PLACE_FILTERS.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingTypes.length > 0 && (
                <p className="mt-6 text-sm text-slate-500">
                  Loading{" "}
                  {loadingTypes
                    .map((type) => PLACE_TYPE_LABELS[type])
                    .join(" and ")}
                  …
                </p>
              )}

              {failedTypes.map((type) => {
                const entry = placeEntries[type];

                return (
                  <div
                    key={type}
                    className="mt-6 flex flex-wrap items-center gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  >
                    <p className="flex-1">
                      Couldn't load {PLACE_TYPE_LABELS[type]}.{" "}
                      {entry?.status === "error" ? entry.message : ""}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadPlaces(type)}
                    >
                      Retry
                    </Button>
                  </div>
                );
              })}

              {visiblePlaces.length === 0 ? (
                loadingTypes.length === 0 &&
                failedTypes.length === 0 && (
                  <p className="mt-6 border border-dashed p-4 text-sm text-slate-500">
                    No places match this filter.
                  </p>
                )
              ) : (
                <div className="mt-6 grid items-start gap-4 sm:grid-cols-2">
                  {visiblePlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      trip={trip}
                      bookedDates={getBookedDates(place.id)}
                      unavailableDates={getUnavailableDatesFor(place)}
                      isTimeAvailable={(schedule) => isTimeAvailable(schedule)}
                      suggestTravelTime={(schedule) =>
                        suggestTravelTime(place, schedule)
                      }
                      onAdd={(schedule) => handleAddPlace(place, schedule)}
                    />
                  ))}
                </div>
              )}

              {notLoadedTypes.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-slate-500">Also show:</span>
                  {notLoadedTypes.map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant="outline"
                      onClick={() => loadPlaces(type)}
                    >
                      {PLACE_TYPE_BUTTON_LABELS[type]}
                    </Button>
                  ))}
                </div>
              )}

              {isApiCity && (
                <p className="mt-8 text-xs text-slate-400">
                  Place data © OpenStreetMap contributors, via Geoapify.
                  Descriptions from Wikidata.
                </p>
              )}
            </section>

            <aside className="border bg-slate-50 p-6">
              <Itinerary
                itinerary={itinerary}
                trip={trip}
                isTimeAvailable={isTimeAvailable}
                getUnavailableDates={getUnavailableDatesFor}
                onRemove={(itemId) =>
                  setItinerary((current) =>
                    current.filter((item) => item.id !== itemId),
                  )
                }
                onEdit={handleEditItem}
              />

              <div className="mt-8 border-t pt-6">
                {savedTripId ? (
                  <>
                    <p className="text-sm font-medium text-slate-900">
                      ✓ Saved to My trips
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Changes save automatically.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
                      <Link to="/trips" className="underline">
                        View my trips
                      </Link>
                      <Link to="/" className="underline">
                        Plan another trip
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      className="h-auto w-full px-5 py-3 text-base"
                      onClick={handleSaveTrip}
                    >
                      Save trip
                    </Button>
                    <p className="mt-2 text-sm text-slate-500">
                      Save it to My trips to come back and edit it later.
                    </p>
                  </>
                )}

                {saveError && (
                  <p className="mt-3 text-sm text-red-600">{saveError}</p>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <p className="mt-6 text-slate-600">
            Choose your dates to start adding places.
          </p>
        )}
      </main>
    </>
  );
}

export default Planner;
