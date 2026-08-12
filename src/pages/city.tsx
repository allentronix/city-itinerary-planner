import { useState } from "react";
import { useParams } from "react-router-dom";
import type { Place } from "../data/cities";
import cities from "../data/cities";
import PlaceCard from "../components/place-card";

interface ItineraryItem {
  place: Place;
  startTime: string;
  duration: number;
}

function durationToMinutes(duration: string): number {
  const [hours, minutes] = duration.split(":").map(Number);

  return hours * 60 + minutes;
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

function City() {
  const { id } = useParams();

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [error, setError] = useState("");

  const city = cities.find((city) => city.id === id);

  if (!city) {
    return <h1>City not found</h1>;
  }
  function findTimeClash(
    startTime: string,
    duration: number,
  ): ItineraryItem | null {
    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + duration;

    const conflict = itinerary.find((item) => {
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

      <h2>Places to visit</h2>
      {error && <p className="mt-2 text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {city.places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onAdd={(startTime, duration) => {
              const durationMinutes = durationToMinutes(duration);
              const alreadyAdded = itinerary.some(
                (item) => item.place.id === place.id
              );

              
              if (alreadyAdded) {
                setError(`${place.name} is already in your itinerary.`);
                return;
              }


              const conflict = findTimeClash(startTime, durationMinutes);
              if (conflict) {
                setError(`This time overlaps with ${conflict.place.name}.`);
                return;
              }
              setError("");

              setItinerary((current) => [
                ...current,
                {
                  place,
                  startTime,
                  duration: durationMinutes,
                },
              ]);
            }}
            onRemove={() =>
              setItinerary((current) =>
                current.filter((item) => item.place.id !== place.id),
              )
            }
          />
        ))}
      </div>

      <h2>My Itinerary</h2>

      <p>{itinerary.length} places selected</p>

      <div>
        {itinerary.map((item) => {
          const endTime = addMinutesToTime(item.startTime, item.duration);

          return (
            <div key={item.place.id}>
              <p>
                {item.startTime} – {endTime}
              </p>
              <p>{item.place.name}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default City;
