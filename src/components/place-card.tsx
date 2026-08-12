import { useState } from "react";
import { Button } from "./ui/button";
import type { Place } from "../data/cities";

interface PlaceCardProps {
  place: Place;
  onAdd: (startTime: string, duration: string) => void;
  onRemove: () => void;
}

function PlaceCard({ place, onAdd, onRemove }: PlaceCardProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("1:00");

  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{place.name}</h3>

      <p className="mt-2">{place.description}</p>

      <p className="mt-2 text-sm">
        Best time: {place.bestTime}
      </p>

      <div className="mt-4">
        <label className="block text-sm font-medium">
          Start time
        </label>

        <input
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          className="mt-1 rounded border p-2"
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium">
          Duration
        </label>

        <input
          type="text"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          placeholder="1:45"
          className="mt-1 rounded border p-2"
        />
      </div>

      <Button
        className="mt-4"
        onClick={() => onAdd(startTime, duration)}
      >
        Add to itinerary
      </Button>

      <Button
        className="mt-2"
        variant="destructive"
        onClick={onRemove}
      >
        Remove
      </Button>
    </div>
  );
}

export default PlaceCard;