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

function City() {
  const { id } = useParams();

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);

  const city = cities.find((city) => city.id === id);

  if (!city) {
    return <h1>City not found</h1>;
  }
  function hasTimeClash(
    startTime: string,
    duration: number
  ): boolean {
    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + duration;
  
    return itinerary.some((item) => {
      const existingStart = timeToMinutes(item.startTime);
      const existingEnd = existingStart + item.duration;
  
      return newStart < existingEnd && newEnd > existingStart;
    });
  }

  return (
    <main>
      <h1>{city.name}</h1>
      <p>{city.country}</p>

      <h2>Places to visit</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {city.places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onAdd={(startTime, duration) => {
              const durationMinutes = durationToMinutes(duration);
            
              if (hasTimeClash(startTime, durationMinutes)) {
                alert("This time overlaps with another event.");
                return;
              }
            
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
                current.filter((item) => item.place.id !== place.id)
              )
            }
          />
        ))}
      </div>

      <h2>My Itinerary</h2>

      <p>{itinerary.length} places selected</p>

      <div>
        {itinerary.map((item) => (
          <p key={item.place.id}>
            {item.startTime} — {item.place.name} ({item.duration} minutes)
          </p>
        ))}
      </div>
    </main>
  );
}

export default City;