import { useEffect, useState } from "react";
import {
  fetchForecast,
  getForecastRange,
  type Coordinates,
  type WeatherByDate,
} from "../utils/weather";

export type WeatherStatus =
  // The trip is too far ahead (or already over) for a forecast.
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "ready"; byDate: WeatherByDate }
  | { status: "error" };

export function useWeather(
  coordinates: Coordinates | null,
  startDate: string,
  endDate: string,
): WeatherStatus {
  const range = getForecastRange(startDate, endDate);

  const key =
    coordinates && range
      ? `${coordinates.lat},${coordinates.lon},${range.start},${range.end}`
      : null;

  // Results are kept with the request they belong to, so changing the trip's
  // dates never shows the old forecast.
  const [result, setResult] = useState<{
    key: string;
    weather: WeatherStatus;
  } | null>(null);

  useEffect(() => {
    if (!key || !coordinates || !range) {
      return;
    }

    let isCurrent = true;

    fetchForecast(coordinates, range.start, range.end).then(
      (byDate) =>
        isCurrent && setResult({ key, weather: { status: "ready", byDate } }),
      () => isCurrent && setResult({ key, weather: { status: "error" } }),
    );

    return () => {
      isCurrent = false;
    };
    // The key covers the coordinates and dates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) {
    return { status: "unavailable" };
  }

  return result?.key === key ? result.weather : { status: "loading" };
}
