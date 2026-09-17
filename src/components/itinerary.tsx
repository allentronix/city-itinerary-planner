import type { ItineraryItem, Trip } from "../data/types";

import { useState } from "react";

import { getTripDates } from "../utils/dates";

import EditItineraryItem from "./edit-itinerary-item";

interface ItineraryProps {
  itinerary: ItineraryItem[];
  trip: Trip;
  onRemove: (placeId: string) => void;
  onEdit: (
    placeId: string,
    date: string,
    startTime: string,
    duration: number,
    travelTime: number,
  ) => string | null;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;

  const hours = Math.floor(totalMinutes / 60) % 24;

  const mins = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getTimeDifference(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function Itinerary({ itinerary, trip, onRemove, onEdit }: ItineraryProps) {
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  const sortedItinerary = [...itinerary].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  const tripDates = getTripDates(trip.startDate, trip.endDate);

  const groupedItinerary = sortedItinerary.reduce(
    (groups, item) => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }

      groups[item.date].push(item);

      return groups;
    },
    {} as Record<string, ItineraryItem[]>,
  );

  return (
    <section>
      <h2 className="text-2xl font-bold">My Itinerary</h2>

      <p className="mt-1 text-sm text-gray-500">
        {itinerary.length} {itinerary.length === 1 ? "place" : "places"}{" "}
        selected
      </p>

      <div>
        {tripDates.map((date) => {
          const items = groupedItinerary[date] ?? [];

          return (
            <div key={date}>
              <div className="mt-8 border-b pb-2">
                <h3 className="text-xl font-semibold">
                  Day {tripDates.indexOf(date) + 1}
                </h3>

                <p className="text-sm text-gray-500">
                  {formatDate(date)} · {items.length}{" "}
                  {items.length === 1 ? "place" : "places"} planned
                </p>
              </div>

              {items.length === 0 ? (
                <p className="mt-3 rounded-md border border-dashed p-3 text-sm text-gray-500">
                  No places planned yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {items.map((item, index) => {
                    const endTime = addMinutesToTime(
                      item.startTime,
                      item.duration,
                    );

                    const nextItem = items[index + 1];

                    let freeTime = 0;

                    if (nextItem) {
                      const availableTime = getTimeDifference(
                        endTime,
                        nextItem.startTime,
                      );

                      freeTime = availableTime - item.travelTime;
                    }

                    return (
                      <div key={item.place.id}>
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                          <div className="flex items-start gap-4 rounded-md bg-gray-50 p-2">
                            <div className="w-24 shrink-0 text-sm font-semibold">
                              {item.startTime}

                              <span className="block text-xs font-normal text-gray-500">
                                until {endTime}
                              </span>
                            </div>

                            <div className="border-l pl-4">
                              <p className="text-lg font-bold">
                                {item.place.name}
                              </p>

                              <p className="mt-1 text-sm text-gray-600">
                                {item.place.description}
                              </p>

                              <p className="mt-2 text-xs text-gray-500">
                                Best time: {item.place.bestTime}
                              </p>

                              <button
                                className="mr-2 mt-3 cursor-pointer rounded border px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                onClick={() => setEditingPlaceId(item.place.id)}
                              >
                                Edit
                              </button>

                              <button
                                className="mr-2 mt-3 cursor-pointer rounded border px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                onClick={() => onRemove(item.place.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {editingPlaceId === item.place.id && (
                            <EditItineraryItem
                              item={item}
                              trip={trip}
                              onCancel={() => setEditingPlaceId(null)}
                              onSave={(
                                date,
                                startTime,
                                duration,
                                travelTime,
                              ) => {
                                const errorMessage = onEdit(
                                  item.place.id,
                                  date,
                                  startTime,
                                  duration,
                                  travelTime,
                                );
                                
                                if (!errorMessage) {
                                  setEditingPlaceId(null);
                                }
                                
                                return errorMessage;
                              }}
                            />
                          )}
                        </div>

                        {nextItem && item.travelTime > 0 && (
                          <p className="py-2 text-center text-xs text-gray-400">
                            ↓ {formatDuration(item.travelTime)} travel to next
                            place
                          </p>
                        )}

                        {nextItem && freeTime > 0 && (
                          <p className="py-2 text-center text-xs text-gray-400">
                            · {formatDuration(freeTime)} free time
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Itinerary;
