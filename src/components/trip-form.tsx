import { useState } from "react";
import { Button } from "./ui/button";

interface TripFormProps {
  cityId: string;
  onCreateTrip: (startDate: string, endDate: string) => void;
}

function TripForm({ cityId, onCreateTrip }: TripFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!startDate || !endDate) {
      setError("Please choose both dates.");
      return;
    }

    if (endDate < startDate) {
      setError("End date must be after the start date.");
      return;
    }

    setError("");
    onCreateTrip(startDate, endDate);
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-xl font-semibold">
        Plan your trip to {cityId}
      </h2>

      <div className="mt-4">
        <label className="block text-sm font-medium">
          Start date
        </label>

        <input
          type="date"
          value={startDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(event) => {
            setStartDate(event.target.value);
            setError("");
          }}
          className="mt-1 rounded border p-2"
        />
      </div>

      <div className="mt-3">
        <label className="block text-sm font-medium">
          End date
        </label>

        <input
          type="date"
          value={endDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(event) => {
            setEndDate(event.target.value);
            setError("");
          }}
          className="mt-1 rounded border p-2"
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button className="mt-4" onClick={handleSubmit}>
        Create trip
      </Button>
    </section>
  );
}

export default TripForm;