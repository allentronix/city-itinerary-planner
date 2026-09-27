import { useId } from "react";
import type { Schedule, Trip } from "../data/types";
import { getTripDays } from "../utils/dates";
import {
  DURATION_OPTIONS,
  TRAVEL_TIME_OPTIONS,
  findAvailableTime,
  formatDuration,
} from "../utils/time";

const HOURS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);

const MINUTES = ["00", "15", "30", "45"];

interface ScheduleFieldsProps {
  trip: Trip;
  value: Schedule;
  preferredStartTime: string;
  unavailableDates?: string[];
  isTimeAvailable: (schedule: Schedule) => boolean;
  onChange: (value: Schedule) => void;
}

function ScheduleFields({
  trip,
  value,
  preferredStartTime,
  unavailableDates = [],
  isTimeAvailable,
  onChange,
}: ScheduleFieldsProps) {
  const id = useId();

  const tripDays = getTripDays(trip.startDate, trip.endDate);

  const [startHour, startMinute] = value.startTime.split(":");

  // Keep items whose duration predates the dropdown selectable.
  const durationOptions = DURATION_OPTIONS.includes(value.duration)
    ? DURATION_OPTIONS
    : [...DURATION_OPTIONS, value.duration].sort((a, b) => a - b);

  function isSlotAvailable(startTime: string, date = value.date): boolean {
    return isTimeAvailable({ ...value, date, startTime });
  }

  function isHourAvailable(hour: string): boolean {
    return MINUTES.some((minute) => isSlotAvailable(`${hour}:${minute}`));
  }

  function handleDayChange(date: string) {
    // Move to a free time if the current one is taken on the new day.
    const startTime = isSlotAvailable(value.startTime, date)
      ? value.startTime
      : findAvailableTime(preferredStartTime, (time) =>
          isSlotAvailable(time, date),
        );

    onChange({ ...value, date, startTime });
  }

  function handleHourChange(hour: string) {
    // Keep the current minute if it's free in the new hour, otherwise pick the first free one.
    const minute = isSlotAvailable(`${hour}:${startMinute}`)
      ? startMinute
      : (MINUTES.find((m) => isSlotAvailable(`${hour}:${m}`)) ?? startMinute);

    onChange({ ...value, startTime: `${hour}:${minute}` });
  }

  return (
    <div>
      <div>
        <label
          className="block text-xs font-medium tracking-wider text-slate-500 uppercase"
          htmlFor={`${id}-day`}
        >
          Day
        </label>

        <select
          id={`${id}-day`}
          value={value.date}
          onChange={(event) => handleDayChange(event.target.value)}
          className="mt-1 border bg-white p-2"
        >
          {tripDays.map((day) => {
            const isBooked = unavailableDates.includes(day.date);

            return (
              <option key={day.date} value={day.date} disabled={isBooked}>
                {isBooked ? `${day.label} (already planned)` : day.label}
              </option>
            );
          })}
        </select>
      </div>

      <div className="mt-3">
        <label
          className="block text-xs font-medium tracking-wider text-slate-500 uppercase"
          htmlFor={`${id}-hour`}
        >
          Start time
        </label>

        <div className="mt-1 flex items-center gap-1">
          <select
            id={`${id}-hour`}
            aria-label="Start hour"
            value={startHour}
            onChange={(event) => handleHourChange(event.target.value)}
            className="border bg-white p-2"
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour} disabled={!isHourAvailable(hour)}>
                {hour}
              </option>
            ))}
          </select>

          <span>:</span>

          <select
            aria-label="Start minute"
            value={startMinute}
            onChange={(event) =>
              onChange({
                ...value,
                startTime: `${startHour}:${event.target.value}`,
              })
            }
            className="border bg-white p-2"
          >
            {MINUTES.map((minute) => (
              <option
                key={minute}
                value={minute}
                disabled={!isSlotAvailable(`${startHour}:${minute}`)}
              >
                {minute}
              </option>
            ))}
          </select>
        </div>

        {!isSlotAvailable(value.startTime) && (
          <p className="mt-1 text-sm text-red-600">
            This time is unavailable. Please choose another.
          </p>
        )}
      </div>

      <div className="mt-3">
        <label
          className="block text-xs font-medium tracking-wider text-slate-500 uppercase"
          htmlFor={`${id}-duration`}
        >
          Duration
        </label>

        <select
          id={`${id}-duration`}
          value={value.duration}
          onChange={(event) =>
            onChange({ ...value, duration: Number(event.target.value) })
          }
          className="mt-1 border bg-white p-2"
        >
          {durationOptions.map((minutes) => (
            <option key={minutes} value={minutes}>
              {formatDuration(minutes)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label
          className="block text-xs font-medium tracking-wider text-slate-500 uppercase"
          htmlFor={`${id}-travel`}
        >
          Travel time afterwards
        </label>

        <select
          id={`${id}-travel`}
          value={value.travelTime}
          onChange={(event) =>
            onChange({ ...value, travelTime: Number(event.target.value) })
          }
          className="mt-1 border bg-white p-2"
        >
          {TRAVEL_TIME_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes === 0 ? "None" : formatDuration(minutes)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ScheduleFields;
