import { useState } from "react";
import type { ItineraryItem, Schedule, Trip } from "../data/types";
import ScheduleFields from "./schedule-fields";
import { Button } from "./ui/button";

interface EditItineraryItemProps {
  item: ItineraryItem;
  trip: Trip;
  isTimeAvailable: (schedule: Schedule) => boolean;
  unavailableDates: string[];
  onCancel: () => void;
  onSave: (schedule: Schedule) => string | null;
}

function EditItineraryItem({
  item,
  trip,
  isTimeAvailable,
  unavailableDates,
  onCancel,
  onSave,
}: EditItineraryItemProps) {
  const [schedule, setSchedule] = useState<Schedule>({
    date: item.date,
    startTime: item.startTime,
    duration: item.duration,
    travelTime: item.travelTime,
  });

  const [error, setError] = useState("");

  return (
    <div className="mt-3">
      <ScheduleFields
        trip={trip}
        value={schedule}
        preferredStartTime={item.startTime}
        unavailableDates={unavailableDates}
        isTimeAvailable={isTimeAvailable}
        onChange={(value) => {
          setSchedule(value);
          setError("");
        }}
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => setError(onSave(schedule) ?? "")}>
          Save
        </Button>

        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default EditItineraryItem;
