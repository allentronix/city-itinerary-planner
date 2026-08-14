import type { ItineraryItem, Trip } from "../data/types";

interface ItineraryProps {
  itinerary: ItineraryItem[];
  trip: Trip;
  onRemove: (placeId: string) => void;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;

  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
function getTripDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];

  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function Itinerary({ itinerary, trip, onRemove }: ItineraryProps) {
  const sortedItinerary = [...itinerary].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
  const tripDates = getTripDates(trip.startDate, trip.endDate);
  const groupedItinerary = sortedItinerary.reduce(
    (groups, item) => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }

      groups[item.date].push(item);

      return groups;
    },
    {} as Record<string, ItineraryItem[]>,
  );

  return (
    <section>
      <h2>My Itinerary</h2>

      <p>{itinerary.length} places selected</p>

      <div>
        {tripDates.map((date) => {
          const items = groupedItinerary[date] ?? [];

          return (
            <div key={date}>
              <h3 className="mt-6 text-xl font-semibold">{formatDate(date)}</h3>

              {items.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">
                  No places planned yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {items.map((item) => {
                    const endTime = addMinutesToTime(
                      item.startTime,
                      item.duration,
                    );

                    return (
                      <div
                        key={item.place.id}
                        className="rounded-lg border p-4"
                      >
                        <p className="text-sm font-medium">
                          {item.startTime} – {endTime}
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {item.place.name}
                        </p>

                        <button
                          className="mt-3 rounded border px-3 py-1 text-sm"
                          onClick={() => onRemove(item.place.id)}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Itinerary;
