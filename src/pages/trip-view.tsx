import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Itinerary from "../components/itinerary";
import PageBanner from "../components/page-banner";
import { buttonVariants } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useCityPhoto } from "../hooks/use-city-photo";
import { formatDateRange, getTripDates } from "../utils/dates";
import {
  getSavedTrip,
  getTripCity,
  getTripDisplayName,
  toItinerary,
} from "../utils/saved-trips";
import NotFound from "./not-found";

// A read-only view of a saved trip, from /trips/:tripId: just the plan, for
// checking on the go. Editing happens at /trips/:tripId/edit.
function TripViewPage() {
  const { tripId = "" } = useParams();

  const loaded = useMemo(() => {
    const savedTrip = getSavedTrip(tripId);
    const city = savedTrip ? getTripCity(savedTrip) : undefined;

    return savedTrip && city ? { savedTrip, city } : null;
  }, [tripId]);

  const photo = useCityPhoto(loaded?.city);

  if (!loaded) {
    return <NotFound title="Trip not found" />;
  }

  const { savedTrip, city } = loaded;
  const { itinerary } = toItinerary(savedTrip.items, city);
  const dayCount = getTripDates(savedTrip.startDate, savedTrip.endDate).length;

  return (
    <>
      <PageBanner
        eyebrow={
          savedTrip.name
            ? [city.name, city.country].filter(Boolean).join(", ")
            : city.country
        }
        title={getTripDisplayName(savedTrip, city)}
        image={photo?.url}
        photoCredit={photo?.credit}
      >
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-white/90">
            {formatDateRange(savedTrip.startDate, savedTrip.endDate)}
            <span className="text-white/60">
              {" "}
              · {dayCount} {dayCount === 1 ? "day" : "days"}
            </span>
          </p>

          <Link
            to={`/trips/${savedTrip.id}/edit`}
            className={buttonVariants({
              size: "sm",
              className: "bg-white text-slate-900 hover:bg-white/90",
            })}
          >
            Edit trip
          </Link>

          <Link
            to="/trips"
            // A see-through outline so it sits quietly beside Edit trip.
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
            )}
          >
            Back to My trips
          </Link>
        </div>
      </PageBanner>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {itinerary.length === 0 ? (
          <div className="border border-dashed bg-white p-8 text-center">
            <p className="text-slate-600">Nothing planned for this trip yet.</p>

            <Link
              to={`/trips/${savedTrip.id}/edit`}
              className={buttonVariants({ className: "mt-4" })}
            >
              Start planning
            </Link>
          </div>
        ) : (
          <Itinerary
            itinerary={itinerary}
            trip={{
              cityId: savedTrip.cityId,
              startDate: savedTrip.startDate,
              endDate: savedTrip.endDate,
            }}
          />
        )}
      </main>
    </>
  );
}

export default TripViewPage;
