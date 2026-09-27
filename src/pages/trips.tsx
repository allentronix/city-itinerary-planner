import { Link } from "react-router-dom";
import cities from "../data/cities";
import PageBanner from "../components/page-banner";
import { Button, buttonVariants } from "../components/ui/button";
import { useSavedTrips } from "../hooks/use-saved-trips";
import { formatDateRange, getTripDates } from "../utils/dates";
import {
  deleteSavedTrip,
  isPastTrip,
  type SavedTrip,
} from "../utils/saved-trips";

function TripCard({ trip }: { trip: SavedTrip }) {
  const city = cities.find((city) => city.id === trip.cityId);
  const cityName = city?.name ?? "Unknown city";
  const dayCount = getTripDates(trip.startDate, trip.endDate).length;
  const placeCount = trip.items.length;

  function handleDelete() {
    if (window.confirm(`Delete your ${cityName} trip? This can't be undone.`)) {
      deleteSavedTrip(trip.id);
    }
  }

  return (
    <div className="flex flex-col border bg-white">
      {city && (
        <img
          src={city.image}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
      )}

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium tracking-wider text-emerald-700 uppercase">
          {city?.country}
        </p>

        <h3 className="mt-1 font-serif text-2xl">{cityName}</h3>

        <p className="mt-1 text-sm text-slate-600">
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {dayCount} {dayCount === 1 ? "day" : "days"} · {placeCount}{" "}
          {placeCount === 1 ? "place" : "places"}
        </p>

        <div className="mt-auto flex gap-2 pt-5">
          {city && (
            <Link to={`/trips/${trip.id}`} className={buttonVariants()}>
              Open
            </Link>
          )}

          <Button variant="outline" onClick={handleDelete}>
            Delete
          </Button>
        </div>
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
