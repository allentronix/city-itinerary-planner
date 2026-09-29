import { useId, useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import DateRangePicker from "../components/date-range-picker";
import PageBanner from "../components/page-banner";
import { Button, buttonVariants } from "../components/ui/button";
import { useCityPhoto } from "../hooks/use-city-photo";
import { useSavedTrips } from "../hooks/use-saved-trips";
import {
  MAX_TRIP_DAYS,
  formatDateRange,
  getTodayDate,
  getTripDates,
  validateTripDates,
} from "../utils/dates";
import {
  deleteSavedTrip,
  duplicateSavedTrip,
  getTripCity,
  getTripDisplayName,
  isPastTrip,
  planDuplicate,
  renameSavedTrip,
  type SavedTrip,
} from "../utils/saved-trips";

const LABEL_CLASS =
  "block text-xs font-medium tracking-wider text-slate-500 uppercase";

const MAX_NAME_LENGTH = 60;

function RenameForm({
  trip,
  cityName,
  onDone,
}: {
  trip: SavedTrip;
  cityName: string;
  onDone: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(trip.name ?? "");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    renameSavedTrip(trip.id, name);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t pt-4">
      <label className={LABEL_CLASS} htmlFor={id}>
        Trip name
      </label>
      <input
        id={id}
        type="text"
        value={name}
        maxLength={MAX_NAME_LENGTH}
        placeholder={cityName}
        autoFocus
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onDone()}
        className="mt-1 w-full border bg-white p-2"
      />
      <p className="mt-1 text-xs text-slate-500">
        Leave empty to show the city name.
      </p>

      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function DuplicateForm({
  trip,
  displayName,
  onDone,
}: {
  trip: SavedTrip;
  displayName: string;
  onDone: () => void;
}) {
  const navigate = useNavigate();
  const id = useId();
  const today = getTodayDate();

  // Start from the same dates when they're still ahead; otherwise pick new ones.
  const [startDate, setStartDate] = useState(
    trip.startDate >= today ? trip.startDate : "",
  );
  const [endDate, setEndDate] = useState(
    trip.startDate >= today ? trip.endDate : "",
  );
  const [error, setError] = useState("");

  const hasDates = Boolean(startDate && endDate);
  const { droppedCount } = hasDates
    ? planDuplicate(trip, startDate, endDate)
    : { droppedCount: 0 };

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const dateError = validateTripDates(startDate, endDate);

    if (dateError) {
      setError(dateError);
      return;
    }

    const newId = duplicateSavedTrip(
      trip,
      startDate,
      endDate,
      `${displayName} (copy)`,
    );

    if (!newId) {
      setError("Couldn't save the copy. Your browser may be blocking storage.");
      return;
    }

    navigate(`/trips/${newId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t pt-4">
      <label className={LABEL_CLASS} htmlFor={id}>
        Dates for the copy
      </label>
      <DateRangePicker
        id={id}
        compact
        className="mt-1 w-full border bg-white px-3 py-2"
        startDate={startDate}
        endDate={endDate}
        minDate={today}
        maxDays={MAX_TRIP_DAYS}
        onChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setError("");
        }}
      />
      <p className="mt-1 text-xs text-slate-500">
        Activities keep their day of the trip: day 1 stays day 1.
      </p>

      {droppedCount > 0 && (
        <p className="mt-2 text-sm text-amber-700">
          {droppedCount}{" "}
          {droppedCount === 1 ? "activity falls" : "activities fall"} after the
          new end date and won't be copied.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={!hasDates}>
          Create copy
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TripCard({ trip }: { trip: SavedTrip }) {
  const city = getTripCity(trip);
  const photo = useCityPhoto(city);
  const cityName = city?.name ?? "Unknown city";
  const displayName = getTripDisplayName(trip, city);
  const dayCount = getTripDates(trip.startDate, trip.endDate).length;
  const placeCount = trip.items.length;

  const [panel, setPanel] = useState<"rename" | "duplicate" | null>(null);

  function handleDelete() {
    if (window.confirm(`Delete "${displayName}"? This can't be undone.`)) {
      deleteSavedTrip(trip.id);
    }
  }

  return (
    <div className="flex flex-col border bg-white">
      {photo ? (
        <img
          src={photo.url}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        // Cities found through search may have no photo.
        <div
          className="flex aspect-[16/9] w-full items-end bg-linear-to-br from-slate-800 to-slate-600 p-5"
          aria-hidden="true"
        >
          <span className="font-serif text-3xl text-white/90">
            {city?.name}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium tracking-wider text-emerald-700 uppercase">
          {trip.name ? `${cityName}, ${city?.country ?? ""}` : city?.country}
        </p>

        <h3 className="mt-1 font-serif text-2xl">{displayName}</h3>

        <p className="mt-1 text-sm text-slate-600">
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {dayCount} {dayCount === 1 ? "day" : "days"} · {placeCount}{" "}
          {placeCount === 1 ? "place" : "places"}
        </p>

        {panel === "rename" && (
          <RenameForm
            trip={trip}
            cityName={cityName}
            onDone={() => setPanel(null)}
          />
        )}

        {panel === "duplicate" && (
          <DuplicateForm
            trip={trip}
            displayName={displayName}
            onDone={() => setPanel(null)}
          />
        )}

        {!panel && (
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            {city && (
              <Link to={`/trips/${trip.id}`} className={buttonVariants()}>
                Open
              </Link>
            )}

            <Button variant="outline" onClick={() => setPanel("rename")}>
              Rename
            </Button>

            {city && (
              <Button variant="outline" onClick={() => setPanel("duplicate")}>
                Duplicate
              </Button>
            )}

            <Button variant="outline" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TripSection({ title, trips }: { title: string; trips: SavedTrip[] }) {
  if (trips.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-serif text-3xl tracking-tight">{title}</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </section>
  );
}

function TripsPage() {
  const trips = useSavedTrips();

  // Soonest upcoming trip first; most recent past trip first.
  const upcoming = trips
    .filter((trip) => !isPastTrip(trip))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const past = trips
    .filter(isPastTrip)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <>
      <PageBanner eyebrow="Your plans" title="My trips" />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {trips.length === 0 ? (
          <div className="border border-dashed bg-white p-10 text-center">
            <h2 className="font-serif text-2xl">No saved trips yet</h2>

            <p className="mt-2 text-slate-600">
              Plan a trip and press Save trip to keep it here.
            </p>

            <Link
              to="/"
              className={buttonVariants({
                className: "mt-6 h-auto px-5 py-3 text-base",
              })}
            >
              Plan a trip
            </Link>
          </div>
        ) : (
          <>
            <TripSection title="Upcoming" trips={upcoming} />
            <TripSection title="Past trips" trips={past} />
          </>
        )}
      </main>
    </>
  );
}

export default TripsPage;
