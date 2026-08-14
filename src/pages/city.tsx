import { useState } from "react";
import { useParams } from "react-router-dom";
import type { ItineraryItem, Trip } from "../data/types";
import cities from "../data/cities";
import PlaceCard from "../components/place-card";
import Itinerary from "../components/itinerary";
import TripForm from "../components/trip-form";

function durationToMinutes(duration: string): number {
  const [hours, minutes] = duration.split(":").map(Number);

  return hours * 60 + minutes;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
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

function getTripDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];

  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function City() {
  const { id } = useParams();

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState("");

  const city = cities.find((city) => city.id === id);

  if (!city) {
    return <h1>City not found</h1>;
  }

  function findTimeClash(
    date: string,
    startTime: string,
    duration: number,
  ): ItineraryItem | null {
    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + duration;

    const conflict = itinerary.find((item) => {
      if (item.date !== date) {
        return false;
      }
      const existingStart = timeToMinutes(item.startTime);
      const existingEnd = existingStart + item.duration;

      return newStart < existingEnd && newEnd > existingStart;
    });

    return conflict ?? null;
  }

  return (
    <main>
      <h1>{city.name}</h1>
      <p>{city.country}</p>

      <TripForm
        cityId={city.id}
        onCreateTrip={(startDate, endDate) => {
          setTrip({
            cityId: city.id,
            startDate,
            endDate,
          });
        }}
      />

      {trip && (
        <div className="mt-4 rounded-lg border p-4">
          <p className="font-semibold">Your trip</p>

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
                {getTripDates(trip.startDate, trip.endDate).map(
                  (date, index) => (
                    <div key={date} className="rounded border p-2 text-sm">
                      Day {index + 1} — {formatDate(date)}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          <p className="text-sm">
            {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
          </p>
          <p className="mt-1 text-sm">
            {calculateTripDays(trip.startDate, trip.endDate)} days
          </p>
        </div>
      )}
      {trip ? (
        <>
          <h2>Places to visit</h2>

          {error && <p className="mt-2 text-red-600">{error}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            {city.places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                trip={trip}
                onAdd={(date, startTime, duration) => {
                  const durationMinutes = durationToMinutes(duration);

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
                  );

                  if (conflict) {
                    setError(`This time overlaps with ${conflict.place.name}.`);
                    return;
                  }

                  setError("");

                  setItinerary((current) => [
                    ...current,
                    {
                      place,
                      date,
                      startTime,
                      duration: durationMinutes,
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
        <Itinerary
          itinerary={itinerary}
          trip={trip}
          onRemove={(placeId) =>
            setItinerary((current) =>
              current.filter((item) => item.place.id !== placeId),
            )
          }
        />
      )}
    </main>
  );
}

export default City;
