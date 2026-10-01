import { useMemo } from "react";
import { useParams } from "react-router-dom";
import Planner from "../components/planner";
import { useIsLoadingTrips } from "../hooks/use-auth";
import { useSavedTrips } from "../hooks/use-saved-trips";
import { getSavedTrip, getTripCity, toItinerary } from "../utils/saved-trips";
import NotFound from "./not-found";
import TripLoading from "./trip-loading";

// Opens a saved trip from /trips/:tripId; changes save automatically.
function SavedTripPage() {
  const { tripId = "" } = useParams();
  const isLoadingTrips = useIsLoadingTrips();

  // Whether the trip is here yet: on a new device it arrives from the account.
  const exists = useSavedTrips().some((trip) => trip.id === tripId);

  // Read once the trip is here: the planner keeps its own state and saves
  // changes itself.
  const loaded = useMemo(() => {
    const savedTrip = exists ? getSavedTrip(tripId) : undefined;
    const city = savedTrip ? getTripCity(savedTrip) : undefined;

    return savedTrip && city ? { savedTrip, city } : null;
  }, [tripId, exists]);

  if (!loaded) {
    return isLoadingTrips ? (
      <TripLoading />
    ) : (
      <NotFound title="Trip not found" />
    );
  }

  const { savedTrip, city } = loaded;
  const { itinerary, missingCount } = toItinerary(savedTrip.items, city);

  const notice =
    missingCount > 0
      ? `${missingCount} ${
          missingCount === 1 ? "place is" : "places are"
        } no longer available and ${
          missingCount === 1 ? "was" : "were"
        } removed from this trip.`
      : undefined;

  return (
    <Planner
      key={savedTrip.id}
      city={city}
      initialTrip={{
        cityId: savedTrip.cityId,
        startDate: savedTrip.startDate,
        endDate: savedTrip.endDate,
      }}
      initialItinerary={itinerary}
      savedTripId={savedTrip.id}
      notice={notice}
      tripName={savedTrip.name}
    />
  );
}

export default SavedTripPage;
