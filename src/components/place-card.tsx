import { useState } from "react";
import { Button } from "./ui/button";
import type { Place } from "../data/cities";

interface PlaceCardProps {
  place: Place;
  onAdd: (startTime: string, duration: string) => void;
}

function isValidDuration(duration: string): boolean {
  const match = duration.match(/^(\d+):([0-5]\d)$/);

  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours > 0 || minutes > 0;
}

function PlaceCard({ place, onAdd }: PlaceCardProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("1:00");
  const [durationError, setDurationError] = useState("");

  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{place.name}</h3>

      <p className="mt-2">{place.description}</p>

      <p className="mt-2 text-sm">Best time: {place.bestTime}</p>

      <div className="mt-4">
        <label className="block text-sm font-medium">Start time</label>

        <input
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          className="mt-1 rounded border p-2"
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium">Duration</label>

        <input
          type="text"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          placeholder="1:45"
          className="mt-1 rounded border p-2"
        />
      </div>
      {durationError && (
        <p className="mt-1 text-sm text-red-600">{durationError}</p>
      )}

      <Button
        className="mt-4"
        onClick={() => {
          if (!isValidDuration(duration)) {
            setDurationError("Enter a duration like 1:45.");
            return;
          }

          setDurationError("");
          onAdd(startTime, duration);
        }}
      >
        Add to itinerary
      </Button>
    </div>
  );
}

export default PlaceCard;
