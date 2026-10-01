import { useState } from "react";
import { Button } from "./ui/button";
import ScheduleFields from "./schedule-fields";
import CustomPlaceForm from "./custom-place-form";
import type { Place, Schedule, Trip } from "../data/types";
import { getSuggestedStartTime } from "../utils/best-time";
import type { CustomPlaceFields } from "../utils/custom-places";
import { getTripDates } from "../utils/dates";
import { CATEGORY_LABELS, canVisitDaily } from "../utils/places";
import { findAvailableTime } from "../utils/time";

const DEFAULT_DURATION = 60;

// Same size as the "Plan a trip" button in the navbar.
const LARGE_BUTTON_CLASS = "h-auto px-5 py-3 text-base";

interface PlaceCardProps {
  place: Place;
  trip: Trip;
  bookedDates: string[];
  unavailableDates: string[];
  isTimeAvailable: (schedule: Schedule) => boolean;
  onAdd: (schedule: Schedule) => string | null;
  // Only for your own places. Update returns an error message, or null once saved.
  onUpdatePlace?: (fields: CustomPlaceFields) => string | null;
  onDeletePlace?: () => void;
  cityName: string;
}

function PlaceCard({
  place,
  trip,
  bookedDates,
  unavailableDates,
  isTimeAvailable,
  onAdd,
  onUpdatePlace,
  onDeletePlace,
  cityName,
}: PlaceCardProps) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [error, setError] = useState("");
  const [isEditingPlace, setIsEditingPlace] = useState(false);

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

  if (isEditingPlace && onUpdatePlace) {
    return (
      <div className="border border-amber-300 bg-white p-5">
        <p className="mb-4 font-serif text-xl">Edit your place</p>

        <CustomPlaceForm
          cityName={cityName}
          place={place}
          onCancel={() => setIsEditingPlace(false)}
          onSave={(fields) => {
            const errorMessage = onUpdatePlace(fields);

            if (!errorMessage) {
              setIsEditingPlace(false);
            }

            return errorMessage;
          }}
        />
      </div>
    );
  }

  const isCustom = place.source === "custom";

  return (
    <div
      className={`border bg-white p-5 ${isCustom ? "border-l-4 border-l-amber-400" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wider text-emerald-700 uppercase">
          {CATEGORY_LABELS[place.category]}
        </p>

        {isCustom && (
          <span className="bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            Your place
          </span>
        )}
      </div>

      <h3 className="mt-1 font-serif text-xl">{place.name}</h3>

      {place.description && (
        <p className="mt-2 text-sm text-slate-600">{place.description}</p>
      )}

      <p className="mt-3 text-sm text-slate-500">Best time: {place.bestTime}</p>

      {place.openingHours && (
        <p className="mt-1 text-sm text-slate-500">
          Hours: {place.openingHours}
        </p>
      )}

      {place.address && (
        <p className="mt-1 text-sm text-slate-500">{place.address}</p>
      )}

      {canVisitDaily(place) && bookedDayNumbers.length > 0 && (
        <p className="mt-1 text-sm text-slate-500">
          Planned for Day {bookedDayNumbers.join(", Day ")}
        </p>
      )}

      {isCustom && (onUpdatePlace || onDeletePlace) && (
        <div className="mt-3 flex gap-2">
          {onUpdatePlace && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditingPlace(true)}
            >
              Edit place
            </Button>
          )}

          {onDeletePlace && (
            <Button size="sm" variant="outline" onClick={onDeletePlace}>
              Delete
            </Button>
          )}
        </div>
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
