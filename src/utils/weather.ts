import type { City } from "../data/types";
import { getTodayDate, shiftDate } from "./dates";

// Daily forecasts from Open-Meteo (free, no key, CC BY 4.0), fetched straight
// from the browser. Forecasts reach about 16 days ahead.

export interface DayWeather {
  date: string;
  label: string;
  icon: string;
  maxTemp: number;
  minTemp: number;
  // Chance of rain at its highest that day, in percent.
  rainChance: number | null;
}

export type WeatherByDate = Record<string, DayWeather>;

export interface Coordinates {
  lat: number;
  lon: number;
}

const FORECAST_DAYS = 16;
const CACHE_MINUTES = 60;

// Built-in cities don't carry coordinates (place lookups would change if they
// did), so the forecast keeps its own.
const BUILT_IN_COORDINATES: Record<string, Coordinates> = {
  budapest: { lat: 47.4979, lon: 19.0402 },
  rome: { lat: 41.9028, lon: 12.4964 },
  paris: { lat: 48.8566, lon: 2.3522 },
  london: { lat: 51.5074, lon: -0.1278 },
  barcelona: { lat: 41.3874, lon: 2.1686 },
  "new-york": { lat: 40.7128, lon: -74.006 },
  tokyo: { lat: 35.6762, lon: 139.6503 },
  istanbul: { lat: 41.0082, lon: 28.9784 },
  prague: { lat: 50.0755, lon: 14.4378 },
  athens: { lat: 37.9838, lon: 23.7275 },
};

// WMO weather codes, as Open-Meteo reports them.
const WEATHER_CODES: { codes: number[]; label: string; icon: string }[] = [
  { codes: [0], label: "Clear", icon: "☀️" },
  { codes: [1], label: "Mostly clear", icon: "🌤️" },
  { codes: [2], label: "Partly cloudy", icon: "⛅" },
  { codes: [3], label: "Cloudy", icon: "☁️" },
  { codes: [45, 48], label: "Fog", icon: "🌫️" },
  { codes: [51, 53, 55, 56, 57], label: "Drizzle", icon: "🌦️" },
  { codes: [61, 63, 65, 66, 67], label: "Rain", icon: "🌧️" },
  { codes: [80, 81, 82], label: "Showers", icon: "🌦️" },
  { codes: [71, 73, 75, 77, 85, 86], label: "Snow", icon: "🌨️" },
  { codes: [95, 96, 99], label: "Thunderstorms", icon: "⛈️" },
];

function describeCode(code: number): { label: string; icon: string } {
  return (
    WEATHER_CODES.find((entry) => entry.codes.includes(code)) ?? {
      label: "Mixed",
      icon: "🌡️",
    }
  );
}

// e.g. "☀️ Clear · 24° / 15° · 10% rain"
export function describeWeather(day: DayWeather): string {
  const rain =
    day.rainChance !== null && day.rainChance >= 20
      ? ` · ${day.rainChance}% rain`
      : "";

  return `${day.icon} ${day.label} · ${day.maxTemp}° / ${day.minTemp}°${rain}`;
}

export function getCityCoordinates(city: City): Coordinates | null {
  if (city.lat !== undefined && city.lon !== undefined) {
    return { lat: city.lat, lon: city.lon };
  }

  return BUILT_IN_COORDINATES[city.id] ?? null;
}

// Fahrenheit for people in the US; Celsius everywhere else. US English is
// many browsers' default worldwide, so the time zone has to agree too.
export const usesFahrenheit =
  new Intl.Locale(navigator.language).maximize().region === "US" &&
  /^(America|Pacific\/Honolulu)/.test(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

// The part of the trip a forecast exists for, or null if none of it does.
export function getForecastRange(
  startDate: string,
  endDate: string,
): { start: string; end: string } | null {
  const today = getTodayDate();
  const lastForecastDay = shiftDate(today, FORECAST_DAYS - 1);

  const start = startDate > today ? startDate : today;
  const end = endDate < lastForecastDay ? endDate : lastForecastDay;

  return start <= end ? { start, end } : null;
}

interface ForecastResponse {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
}

const cache = new Map<
  string,
  { fetchedAt: number; request: Promise<WeatherByDate> }
>();

async function requestForecast(
  { lat, lon }: Coordinates,
  start: string,
  end: string,
): Promise<WeatherByDate> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    start_date: start,
    end_date: end,
  });

  if (usesFahrenheit) {
    params.set("temperature_unit", "fahrenheit");
  }

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Forecast request failed (${response.status})`);
  }

  const { daily } = (await response.json()) as ForecastResponse;
  const byDate: WeatherByDate = {};

  daily.time.forEach((date, index) => {
    byDate[date] = {
      date,
      ...describeCode(daily.weather_code[index]),
      maxTemp: Math.round(daily.temperature_2m_max[index]),
      minTemp: Math.round(daily.temperature_2m_min[index]),
      rainChance: daily.precipitation_probability_max[index],
    };
  });

  return byDate;
}

// Forecast for the given days, shared between pages and kept for an hour.
export function fetchForecast(
  coordinates: Coordinates,
  start: string,
  end: string,
): Promise<WeatherByDate> {
  const key = `${coordinates.lat.toFixed(2)},${coordinates.lon.toFixed(2)},${start},${end}`;
  const cached = cache.get(key);

  if (cached && Date.now() - cached.fetchedAt < CACHE_MINUTES * 60_000) {
    return cached.request;
  }

  const request = requestForecast(coordinates, start, end);
  cache.set(key, { fetchedAt: Date.now(), request });

  // Let a failed request be tried again next time.
  request.catch(() => cache.delete(key));

  return request;
}
