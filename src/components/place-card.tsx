import { useState } from "react";
import { Button } from "./ui/button";
import ScheduleFields from "./schedule-fields";
import type { Place, PlaceCategory, Schedule, Trip } from "../data/types";
import { getSuggestedStartTime } from "../utils/best-time";
import { getTripDates } from "../utils/dates";
import { canVisitDaily } from "../utils/places";
import { findAvailableTime } from "../utils/time";

const DEFAULT_DURATION = 60;

// Same size as the "Plan a trip" button in the navbar.
const LARGE_BUTTON_CLASS = "h-auto px-5 py-3 text-base";

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  attraction: "Sight",
  restaurant: "Restaurant",
  cafe: "Coffee shop",
};

interface PlaceCardProps {
  place: Place;
  trip: Trip;
  bookedDates: string[];
  unavailableDates: string[];
  isTimeAvailable: (schedule: Schedule) => boolean;
  onAdd: (schedule: Schedule) => string | null;
}

function PlaceCard({
  place,
  trip,
  bookedDates,
  unavailableDates,
  isTimeAvailable,
  onAdd,
}: PlaceCardProps) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState("");

  const tripDates = getTripDates(trip.startDate, trip.endDate);

  const availableDates = tripDates.filter(
    (date) => !unavailableDates.includes(date),
  );

  const isFullyBooked = availableDates.length === 0;

  const preferredStartTime = getSuggestedStartTime(place.bestTime);

  const bookedDayNumbers = tripDates
    .map((date, index) => (bookedDates.includes(date) ? index + 1 : null))
    .filter((dayNumber) => dayNumber !== null);

  function handleOpen() {
    const draft: Schedule = {
      date: availableDates[0],
      startTime: preferredStartTime,
      duration: DEFAULT_DURATION,
      travelTime: 0,
    };

    // Start at the place's best time, or the next free slot after it.
    draft.startTime = findAvailableTime(preferredStartTime, (startTime) =>
      isTimeAvailable({ ...draft, startTime }),
    );

    setSchedule(draft);
    setError("");
  }

  function handleClose() {
    setSchedule(null);
    setError("");
  }

  function handleAdd(value: Schedule) {
    const errorMessage = onAdd(value);

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    handleClose();
  }

  // Fall back to the first open day if the chosen one is no longer available.
  const current =
    schedule && !availableDates.includes(schedule.date)
      ? { ...schedule, date: availableDates[0] }
      : schedule;

  return (
    <div className="border bg-white p-5">
      <p className="text-xs font-medium tracking-wider text-emerald-700 uppercase">
        {CATEGORY_LABELS[place.category]}
      </p>

      <h3 className="mt-1 font-serif text-xl">{place.name}</h3>

      <p className="mt-2 text-sm text-slate-600">{place.description}</p>

      <p className="mt-3 text-sm text-slate-500">Best time: {place.bestTime}</p>

      {canVisitDaily(place) && bookedDayNumbers.length > 0 && (
        <p className="mt-1 text-sm text-slate-500">
          Planned for Day {bookedDayNumbers.join(", Day ")}
        </p>
      )}

      {isFullyBooked ? (
        <Button className={`mt-4 ${LARGE_BUTTON_CLASS}`} disabled>
          {canVisitDaily(place) ? "✓ Added every day" : "✓ Added"}
        </Button>
      ) : !current?.date ? (
        <Button className={`mt-4 ${LARGE_BUTTON_CLASS}`} onClick={handleOpen}>
          {bookedDates.length > 0 ? "Add another day" : "Add to itinerary"}
        </Button>
      ) : (
        <div className="mt-4 border-t pt-4">
          <ScheduleFields
            trip={trip}
            value={current}
            preferredStartTime={preferredStartTime}
            unavailableDates={unavailableDates}
            isTimeAvailable={isTimeAvailable}
            onChange={(value) => {
              setSchedule(value);
              setError("");
            }}
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex gap-2">
            <Button onClick={() => handleAdd(current)}>Add</Button>

            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaceCard;
