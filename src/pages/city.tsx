import { useParams, useSearchParams } from "react-router-dom";
import cities from "../data/cities";
import type { Trip } from "../data/types";
import Planner from "../components/planner";
import { validateTripDates } from "../utils/dates";
import NotFound from "./not-found";

function buildTripFromSearch(
  cityId: string,
  startDate: string | null,
  endDate: string | null,
): Trip | null {
  if (!startDate || !endDate || validateTripDates(startDate, endDate)) {
    return null;
  }

  return { cityId, startDate, endDate };
}

// Plans a new, unsaved trip from /city/:id?start=…&end=…
function CityPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const city = cities.find((city) => city.id === id);

  if (!city) {
    return <NotFound title="City not found" />;
  }

  return (
    <Planner
      key={city.id}
      city={city}
      initialTrip={buildTripFromSearch(
        city.id,
        searchParams.get("start"),
        searchParams.get("end"),
      )}
    />
  );
}

export default CityPage;
