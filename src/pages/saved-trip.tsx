import { useParams } from "react-router-dom";
import cities from "../data/cities";
import Planner from "../components/planner";
import { getSavedTrip, toItinerary } from "../utils/saved-trips";
import NotFound from "./not-found";

// Opens a saved trip from /trips/:tripId; changes save automatically.
function SavedTripPage() {
  const { tripId = "" } = useParams();

  const savedTrip = getSavedTrip(tripId);
  const city = cities.find((city) => city.id === savedTrip?.cityId);

  if (!savedTrip || !city) {
    return <NotFound title="Trip not found" />;
  }

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
    />
  );
}

export default SavedTripPage;
