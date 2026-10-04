import type { ItineraryItem, Place, Schedule, Trip } from "../data/types";

import { lazy, Suspense, useState } from "react";

import {
  formatShortDate,
  formatWeekdayDate,
  getTripDates,
} from "../utils/dates";

import { addMinutesToTime, timeToMinutes } from "../utils/time";

import { hasCoordinates } from "../utils/geo";

import { describeWeather, type Coordinates } from "../utils/weather";

import { useWeather } from "../hooks/use-weather";

import ForecastStrip from "./forecast-strip";

// Leaflet is only downloaded the first time someone opens a map.
const DayMap = lazy(() => import("./day-map"));

import ConfirmDialog from "./confirm-dialog";

import NoteEditor from "./note-editor";

import TravelConnector from "./travel-connector";

import PlacePhoto from "./place-photo";

import EditItineraryItem from "./edit-itinerary-item";

import { Button } from "./ui/button";

export interface ItineraryActions {
  isTimeAvailable: (schedule: Schedule, excludeItemId: string) => boolean;
  getUnavailableDates: (place: Place, excludeItemId: string) => string[];
  onRemove: (itemId: string) => void;
  onEdit: (item: ItineraryItem, schedule: Schedule) => string | null;
  // An empty note removes it.
  onNoteChange: (itemId: string, note: string) => void;
  // Travel time to the next stop, set by hand; 0 goes back to the estimate.
  onTravelTimeChange: (itemId: string, minutes: number) => void;
}

interface ItineraryProps {
  itinerary: ItineraryItem[];
  trip: Trip;
  // Without actions the itinerary is read-only: no Edit, note or Remove buttons.
  actions?: ItineraryActions;
  // Where the trip is, for the weather forecast.
  location?: Coordinates | null;
}

// A planned day is shown in full; a run of empty days is collapsed into one line.
type DaySection =
  | { kind: "planned"; date: string; dayNumber: number; items: ItineraryItem[] }
  | { kind: "empty"; dates: string[]; firstDayNumber: number };

function groupIntoSections(
  tripDates: string[],
  itinerary: ItineraryItem[],
): DaySection[] {
  const sortedItinerary = [...itinerary].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  const sections: DaySection[] = [];

  tripDates.forEach((date, index) => {
    const items = sortedItinerary.filter((item) => item.date === date);

    const lastSection = sections[sections.length - 1];

    if (items.length > 0) {
      sections.push({ kind: "planned", date, dayNumber: index + 1, items });
    } else if (lastSection?.kind === "empty") {
      lastSection.dates.push(date);
    } else {
      sections.push({
        kind: "empty",
        dates: [date],
        firstDayNumber: index + 1,
      });
    }
  });

  return sections;
}

function EmptyDays({
  dates,
  firstDayNumber,
}: {
  dates: string[];
  firstDayNumber: number;
}) {
  const lastDayNumber = firstDayNumber + dates.length - 1;

  const label =
    dates.length === 1
      ? `Day ${firstDayNumber} · ${formatShortDate(dates[0])}`
      : `Days ${firstDayNumber}–${lastDayNumber} · ${formatShortDate(
          dates[0],
        )} – ${formatShortDate(dates[dates.length - 1])}`;

  return (
    <p className="mt-6 border border-dashed bg-white p-3 text-sm text-slate-500">
      <span className="font-medium text-gray-700">{label}</span> · Nothing
      planned yet
    </p>
  );
}

function Itinerary({
  itinerary,
  trip,
  actions,
  location = null,
}: ItineraryProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Days whose map is open.
  const [mapDates, setMapDates] = useState<string[]>([]);

  // The activity waiting for the "Remove" confirmation, if any.
  // The activity whose note is being written, if any.
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [pendingRemoval, setPendingRemoval] = useState<ItineraryItem | null>(
    null,
  );

  function toggleMap(date: string) {
    setMapDates((open) =>
      open.includes(date)
        ? open.filter((openDate) => openDate !== date)
        : [...open, date],
    );
  }

  const tripDates = getTripDates(trip.startDate, trip.endDate);

  const weather = useWeather(location, trip.startDate, trip.endDate);

  const sections = groupIntoSections(tripDates, itinerary);

  const plannedDays = sections.filter(
    (section) => section.kind === "planned",
  ).length;

  function renderItem(item: ItineraryItem, nextItem?: ItineraryItem) {
    const endTime = addMinutesToTime(item.startTime, item.duration);

    return (
      <div key={item.id}>
        <div className="border bg-white p-4">
          <div className="flex items-start gap-4">
            <div className="w-16 shrink-0 text-sm font-semibold">
              {item.startTime}

              <span className="block text-xs font-normal text-gray-500">
                until {endTime}
              </span>
            </div>

            <div className="min-w-0 flex-1 border-l pl-4">
              <p className="font-serif text-lg">{item.place.name}</p>

              {item.place.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {item.place.description}
                </p>
              )}

              <p className="mt-2 text-xs text-gray-500">
                Best time: {item.place.bestTime}
              </p>

              {item.note && editingNoteId !== item.id && (
                <p className="mt-3 border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm whitespace-pre-line text-slate-700">
                  <span className="sr-only">Note: </span>
                  {item.note}
                </p>
              )}

              {actions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingItemId(item.id)}
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingNoteId(
                        editingNoteId === item.id ? null : item.id,
                      )
                    }
                  >
                    {item.note ? "Edit note" : "Add note"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingRemoval(item)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <PlacePhoto place={item.place} variant="thumb" />
          </div>

          {actions && editingNoteId === item.id && (
            <NoteEditor
              placeName={item.place.name}
              initialNote={item.note}
              onCancel={() => setEditingNoteId(null)}
              onSave={(note) => {
                actions.onNoteChange(item.id, note);
                setEditingNoteId(null);
              }}
            />
          )}

          {actions && editingItemId === item.id && (
            <EditItineraryItem
              item={item}
              trip={trip}
              isTimeAvailable={(schedule) =>
                actions.isTimeAvailable(schedule, item.id)
              }
              unavailableDates={actions.getUnavailableDates(
                item.place,
                item.id,
              )}
              onCancel={() => setEditingItemId(null)}
              onSave={(schedule) => {
                const errorMessage = actions.onEdit(item, schedule);

                if (!errorMessage) {
                  setEditingItemId(null);
                }

                return errorMessage;
              }}
            />
          )}
        </div>

        {nextItem && (
          <TravelConnector
            from={item}
            to={nextItem}
            onTravelTimeChange={
              actions &&
              ((minutes) => actions.onTravelTimeChange(item.id, minutes))
            }
          />
        )}
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-3xl tracking-tight">My Itinerary</h2>

      <p className="mt-1 text-sm text-gray-500">
        {plannedDays} of {tripDates.length}{" "}
        {tripDates.length === 1 ? "day" : "days"} planned · {itinerary.length}{" "}
        {itinerary.length === 1 ? "place" : "places"}
      </p>

      <ForecastStrip weather={weather} tripDates={tripDates} />

      {sections.map((section) =>
        section.kind === "empty" ? (
          <EmptyDays
            key={section.dates[0]}
            dates={section.dates}
            firstDayNumber={section.firstDayNumber}
          />
        ) : (
          <div key={section.date}>
            <div className="mt-8 flex items-end justify-between gap-3 border-b pb-2">
              <div>
                <h3 className="font-serif text-xl">Day {section.dayNumber}</h3>

                <p className="text-sm text-gray-500">
                  {formatWeekdayDate(section.date)} · {section.items.length}{" "}
                  {section.items.length === 1 ? "place" : "places"} planned
                </p>

                {weather.status === "ready" && weather.byDate[section.date] && (
                  <p className="mt-0.5 text-sm text-slate-600">
                    {describeWeather(weather.byDate[section.date])}
                  </p>
                )}
              </div>

              {section.items.some((item) => hasCoordinates(item.place)) && (
                <Button
                  size="sm"
                  variant="outline"
                  aria-expanded={mapDates.includes(section.date)}
                  onClick={() => toggleMap(section.date)}
                >
                  {mapDates.includes(section.date) ? "Hide map" : "Show map"}
                </Button>
              )}
            </div>

            {mapDates.includes(section.date) && (
              <div className="mt-3">
                <Suspense
                  fallback={
                    <p className="flex h-64 items-center justify-center border text-sm text-slate-500">
                      Loading map…
                    </p>
                  }
                >
                  <DayMap
                    stops={section.items
                      .map((item) => item.place)
                      .filter(hasCoordinates)}
                  />
                </Suspense>
              </div>
            )}

            <div className="mt-3 space-y-3">
              {section.items.map((item, index) =>
                renderItem(item, section.items[index + 1]),
              )}
            </div>
          </div>
        ),
      )}

      {actions && (
        <ConfirmDialog
          open={pendingRemoval !== null}
          title="Remove this activity?"
          confirmLabel="Remove"
          destructive
          onConfirm={() => {
            if (pendingRemoval) {
              actions.onRemove(pendingRemoval.id);
            }

            setPendingRemoval(null);
          }}
          onCancel={() => setPendingRemoval(null)}
        >
          {pendingRemoval && (
            <p>
              <strong className="font-medium text-slate-900">
                {pendingRemoval.place.name}
              </strong>{" "}
              at {pendingRemoval.startTime} on Day{" "}
              {tripDates.indexOf(pendingRemoval.date) + 1} (
              {formatShortDate(pendingRemoval.date)}) will be removed from your
              itinerary. You can add it again from Places to visit.
            </p>
          )}
        </ConfirmDialog>
      )}
    </section>
  );
}

export default Itinerary;
