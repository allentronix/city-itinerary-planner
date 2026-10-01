import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Itinerary from "../components/itinerary";
import PageBanner from "../components/page-banner";
import { buttonVariants } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useIsLoadingTrips } from "../hooks/use-auth";
import { useCityPhoto } from "../hooks/use-city-photo";
import { useSavedTrips } from "../hooks/use-saved-trips";
import { formatDateRange, getTripDates } from "../utils/dates";
import {
  getTripCity,
  getTripDisplayName,
  toItinerary,
} from "../utils/saved-trips";
import { getCityCoordinates } from "../utils/weather";
import NotFound from "./not-found";
import TripLoading from "./trip-loading";

// A read-only view of a saved trip, from /trips/:tripId: just the plan, for
// checking on the go. Editing happens at /trips/:tripId/edit.
function TripViewPage() {
  const { tripId = "" } = useParams();
  const isLoadingTrips = useIsLoadingTrips();

  // Follows the saved trip, so changes from another device show up here.
  const found = useSavedTrips().find((trip) => trip.id === tripId);

  const loaded = useMemo(() => {
    const city = found ? getTripCity(found) : undefined;

    return found && city ? { savedTrip: found, city } : null;
  }, [found]);

  const photo = useCityPhoto(loaded?.city);

  if (!loaded) {
    return isLoadingTrips ? (
      <TripLoading />
    ) : (
      <NotFound title="Trip not found" />
    );
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
            location={getCityCoordinates(city)}
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
