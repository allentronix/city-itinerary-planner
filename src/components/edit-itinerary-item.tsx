import { useRef, useState } from "react";
import type { ItineraryItem, Trip } from "../data/types";

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

interface EditItineraryItemProps {
  item: ItineraryItem;
  trip: Trip;
  onCancel: () => void;
  onSave: (
    date: string,
    startTime: string,
    duration: number,
    travelTime: number,
  ) => string | null;
}

function EditItineraryItem({
  item,
  trip,
  onCancel,
  onSave,
}: EditItineraryItemProps) {
  const [error, setError] = useState("");

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);
  const travelTimeInputRef = useRef<HTMLSelectElement>(null);

  return (
    <div className="mt-3">
      <div>
        <label className="block text-sm font-medium">Date</label>
        <input
          type="date"
          ref={dateInputRef}
          defaultValue={item.date}
          min={trip.startDate}
          max={trip.endDate}
          className="mt-1 rounded border p-2"
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium">Start time</label>
        <input
          type="time"
          ref={timeInputRef}
          defaultValue={item.startTime}
          className="mt-1 rounded border p-2"
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium">Duration</label>
        <input
          type="text"
          ref={durationInputRef}
          defaultValue={`${Math.floor(item.duration / 60)}:${String(
            item.duration % 60,
          ).padStart(2, "0")}`}
          className="mt-1 rounded border p-2"
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium">
          Travel time to next place
        </label>

        <select
          ref={travelTimeInputRef}
          defaultValue={item.travelTime}
          className="mt-1 rounded border p-2"
        >
          <option value={0}>0 minutes</option>
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
        </select>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        className="mt-3 rounded border px-3 py-1 text-xs text-gray-500 hover:text-gray-900"
        onClick={onCancel}
      >
        Cancel
      </button>

      <button
        className="ml-2 mt-3 cursor-pointer rounded border px-3 py-1 text-xs font-medium"
        onClick={() => {
          const date = dateInputRef.current?.value ?? item.date;
          const startTime = timeInputRef.current?.value ?? item.startTime;
          const duration = durationToMinutes(
            durationInputRef.current?.value ?? "0:00",
          );
          const travelTime = Number(
            travelTimeInputRef.current?.value ?? item.travelTime,
          );

          if (!isWithinSameDay(startTime, duration)) {
            alert(
              "This activity would continue into the next day. Please choose an earlier start time or shorter duration.",
            );
            return;
          }

          const errorMessage = onSave(date, startTime, duration, travelTime);

          if (errorMessage) {
            setError(errorMessage);
          }
        }}
      >
        Save
      </button>
    </div>
  );
}

export default EditItineraryItem;
