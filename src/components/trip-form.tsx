import { useId, useState } from "react";
import DateRangePicker from "./date-range-picker";
import { Button } from "./ui/button";
import {
  MAX_TRIP_DAYS,
  getEarliestStartDate,
  getTodayDate,
  validateTripDates,
} from "../utils/dates";

interface TripFormProps {
  cityName: string;
  initialStartDate?: string;
  initialEndDate?: string;
  onCreateTrip: (startDate: string, endDate: string) => void;
  onCancel?: () => void;
}

function TripForm({
  cityName,
  initialStartDate = "",
  initialEndDate = "",
  onCreateTrip,
  onCancel,
}: TripFormProps) {
  const isEditing = Boolean(initialStartDate);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [error, setError] = useState("");

  const id = useId();

  function handleSubmit() {
    const dateError = validateTripDates(startDate, endDate, initialStartDate);

    if (dateError) {
      setError(dateError);
      return;
    }

    setError("");
    onCreateTrip(startDate, endDate);
  }

  return (
    <section className="mb-10 border bg-white p-6">
      <h2 className="font-serif text-2xl tracking-tight">
        {isEditing ? "Your trip" : `Plan your trip to ${cityName}`}
      </h2>

      <div className="mt-4">
        <label
          className="block text-xs font-medium tracking-wider text-slate-500 uppercase"
          htmlFor={`${id}-dates`}
        >
          Dates
        </label>

        <DateRangePicker
          id={`${id}-dates`}
          className="mt-1 w-full max-w-xs border bg-white px-3 py-2"
          startDate={startDate}
          endDate={endDate}
          minDate={getEarliestStartDate(initialStartDate)}
          minEndDate={getTodayDate()}
          maxDays={MAX_TRIP_DAYS}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setError("");
          }}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button onClick={handleSubmit}>
          {isEditing ? "Save changes" : "Create trip"}
        </Button>

        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </section>
  );
}

export default TripForm;
