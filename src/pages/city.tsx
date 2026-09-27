import { useState } from "react";

import { useParams } from "react-router-dom";

import type { ItineraryItem, Trip } from "../data/types";

import cities from "../data/cities";

import PlaceCard from "../components/place-card";

import Itinerary from "../components/itinerary";

import TripForm from "../components/trip-form";

import { getTripDates } from "../utils/dates";

function durationToMinutes(duration: string): number {
  const [hours, minutes] = duration.split(":").map(Number);

  return hours * 60 + minutes;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function isWithinSameDay(startTime: string, duration: number): boolean {
  const start = timeToMinutes(startTime);

  const end = start + duration;

  return end <= 24 * 60;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function calculateTripDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);

  const end = new Date(`${endDate}T00:00:00`);

  const difference = end.getTime() - start.getTime();

  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;
}

function City() {
  const { id } = useParams();

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);

  const [trip, setTrip] = useState<Trip | null>(null);

  const [isEditingTrip, setIsEditingTrip] = useState(false);

  const [error, setError] = useState("");

  const city = cities.find((city) => city.id === id);

  if (!city) {
    return <h1>City not found</h1>;
  }

  function findTimeClash(
    date: string,
    startTime: string,
    duration: number,
    travelTime = 0,
    excludePlaceId?: string,
  ): ItineraryItem | null {
    const newStart = timeToMinutes(startTime);

    const newEnd = newStart + duration + travelTime;

    const conflict = itinerary.find((item) => {
      if (item.place.id === excludePlaceId) {
        return false;
      }

      if (item.date !== date) {
        return false;
      }

      const existingStart = timeToMinutes(item.startTime);

      const existingEnd = existingStart + item.duration + item.travelTime;

      return newStart < existingEnd && newEnd > existingStart;
    });

    return conflict ?? null;
  }

  function handleEditPlace(
    placeId: string,
    date: string,
    startTime: string,
    duration: number,
    travelTime: number,
  ): string | null {
    const conflict = findTimeClash(
      date,
      startTime,
      duration,
      travelTime,
      placeId,
    );

    if (conflict) {
      return `This activity clashes with ${conflict.place.name}. Please choose a different time.`;
    }

    setError("");

    setItinerary((current) =>
      current.map((item) =>
        item.place.id === placeId
          ? {
              ...item,
              date,
              startTime,
              duration,
              travelTime,
            }
          : item,
      ),
    );

    return null;
  }

  return (
    <main>
      <h1>{city.name}</h1>

      <p>{city.country}</p>

      {(!trip || isEditingTrip) && (
        <TripForm
          cityId={city.id}
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
        />
      )}

      {trip && (
        <div className="mt-4 rounded-lg border p-4">
          <p className="font-semibold">Your trip</p>

          <p className="text-sm">
            {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
          </p>

          <p className="mt-1 text-sm">
            {calculateTripDays(trip.startDate, trip.endDate)} days
          </p>

          <div className="mt-4 space-y-2">
            {getTripDates(trip.startDate, trip.endDate).map((date, index) => (
              <div key={date} className="rounded border p-2 text-sm">
                Day {index + 1} — {formatDate(date)}
              </div>
            ))}
          </div>

          <button
            className="mt-4 rounded border px-3 py-1 text-sm"
            onClick={() => setIsEditingTrip(true)}
          >
            Edit trip
          </button>
        </div>
      )}

      {trip ? (
        <>
          <h2>Places to visit</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {city.places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                trip={trip}
                onAdd={(date, startTime, duration, travelTime) => {
                  const durationMinutes = durationToMinutes(duration);

                  const travelTimeMinutes = Number(travelTime);

                  if (!isWithinSameDay(startTime, durationMinutes)) {
                    setError(
                      "This activity would continue into the next day. Please choose an earlier start time or shorter duration.",
                    );

                    return;
                  }

                  const alreadyAdded = itinerary.some(
                    (item) => item.place.id === place.id,
                  );

                  if (alreadyAdded) {
                    setError(`${place.name} is already in your itinerary.`);

                    return;
                  }

                  const conflict = findTimeClash(
                    date,
                    startTime,
                    durationMinutes,
                    travelTimeMinutes,
                  );

                  if (conflict) {
                    setError(`This time overlaps with ${conflict.place.name}.`);

                    return;
                  }

                  setItinerary((current) => [
                    ...current,
                    {
                      place,
                      date,
                      startTime,
                      duration: durationMinutes,
                      travelTime: travelTimeMinutes,
                    },
                  ]);
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-6">Create your trip first to start adding places.</p>
      )}

      {trip && (
        <>
          {error && (
            <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Itinerary
            itinerary={itinerary}
            trip={trip}
            onRemove={(placeId) =>
              setItinerary((current) =>
                current.filter((item) => item.place.id !== placeId),
              )
            }
            onEdit={handleEditPlace}
          />
        </>
      )}
    </main>
  );
}

export default City;
