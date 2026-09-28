import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import cities from "../data/cities";
import type { City, Trip } from "../data/types";
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

function parseCoordinate(value: string | null, limit: number) {
  const number = Number(value);

  return value !== null && Number.isFinite(number) && Math.abs(number) <= limit
    ? number
    : undefined;
}

// A built-in city by its id, or a city from search, described by the URL:
// /city/<Geoapify place id>?name=Lisbon&country=Portugal&lat=…&lon=…
function findCity(
  id: string | undefined,
  searchParams: URLSearchParams,
): City | undefined {
  const builtIn = cities.find((city) => city.id === id);

  if (builtIn) {
    return builtIn;
  }

  const name = searchParams.get("name")?.trim();

  if (!id || !/^[0-9a-f]{10,200}$/i.test(id) || !name) {
    return undefined;
  }

  return {
    id,
    name,
    country: searchParams.get("country")?.trim() ?? "",
    lat: parseCoordinate(searchParams.get("lat"), 90),
    lon: parseCoordinate(searchParams.get("lon"), 180),
    places: [],
    source: "api",
  };
}

// Plans a new, unsaved trip from /city/:id?start=…&end=…
function CityPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const city = useMemo(() => findCity(id, searchParams), [id, searchParams]);

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
