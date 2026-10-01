import { useId, useState } from "react";
import type { ItineraryItem } from "../data/types";
import { estimateTravel, formatDistance, getDirectionsUrl } from "../utils/geo";
import {
  TRAVEL_TIME_OPTIONS,
  addMinutesToTime,
  formatDuration,
  timeToMinutes,
} from "../utils/time";

// Gaps shorter than this aren't worth calling free time.
const MIN_FREE_MINUTES = 15;

interface TravelConnectorProps {
  from: ItineraryItem;
  to: ItineraryItem;
  // Set when the itinerary can be edited. 0 goes back to the estimate.
  onTravelTimeChange?: (minutes: number) => void;
}

// The line between two stops on the same day: how long getting there takes,
// whether there's time for it, and directions.
function TravelConnector({
  from,
  to,
  onTravelTimeChange,
}: TravelConnectorProps) {
  const id = useId();
  const [isEditing, setIsEditing] = useState(false);

  const endTime = addMinutesToTime(from.startTime, from.duration);
  const gap = timeToMinutes(to.startTime) - timeToMinutes(endTime);

  const estimate = estimateTravel(from.place, to.place);
  // A travel time set by hand wins over the estimate.
  const manualMinutes = from.travelTime > 0 ? from.travelTime : null;
  const travelMinutes = manualMinutes ?? estimate?.minutes ?? null;

  const directionsUrl = getDirectionsUrl(from.place, to.place, estimate?.mode);

  let travelText: string | null = null;

  if (manualMinutes !== null) {
    travelText = `🕒 ${formatDuration(manualMinutes)} to get there`;
  } else if (estimate?.mode === "walk") {
    travelText = `🚶 ${formatDuration(estimate.minutes)} walk`;
  } else if (estimate) {
    travelText = `🚇 ~${formatDuration(estimate.minutes)} by transit or taxi`;
  }

  if (travelText && estimate) {
    travelText += ` · ${formatDistance(estimate.km)}`;
  }

  const isTight = travelMinutes !== null && travelMinutes > gap;
  const freeMinutes = gap - (travelMinutes ?? 0);

  let timingText: string | null = null;

  if (isTight) {
    timingText = `only ${formatDuration(Math.max(gap, 0))} until ${to.place.name}`;
  } else if (freeMinutes >= MIN_FREE_MINUTES) {
    timingText = `${formatDuration(freeMinutes)} free`;
  }

  if (!travelText && !timingText && !onTravelTimeChange) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center text-xs text-slate-500">
      {travelText && <span>{travelText}</span>}

      {timingText && (
        <span className={isTight ? "font-medium text-amber-700" : ""}>
          {travelText ? "· " : ""}
          {timingText}
        </span>
      )}

      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-slate-700 underline hover:text-slate-900"
        >
          Directions ↗
        </a>
      )}

      {onTravelTimeChange &&
        (isEditing ? (
          <span className="flex items-center gap-1">
            <label htmlFor={id} className="sr-only">
              Travel time to {to.place.name}
            </label>
            <select
              id={id}
              autoFocus
              value={manualMinutes ?? 0}
              onChange={(event) => {
                onTravelTimeChange(Number(event.target.value));
                setIsEditing(false);
              }}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(event) =>
                event.key === "Escape" && setIsEditing(false)
              }
              className="border bg-white px-1 py-0.5 text-xs text-slate-900"
            >
              <option value={0}>{estimate ? "Use estimate" : "Not set"}</option>
              {TRAVEL_TIME_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {formatDuration(minutes)}
                </option>
              ))}
            </select>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-slate-500 underline hover:text-slate-900"
          >
            {travelText ? "Change" : "+ Add travel time"}
          </button>
        ))}
    </div>
  );
}

export default TravelConnector;
