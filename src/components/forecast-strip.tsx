import type { WeatherStatus } from "../hooks/use-weather";
import { getTodayDate } from "../utils/dates";
import { describeWeather } from "../utils/weather";

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  timeZone: "UTC",
});

// e.g. "Sun 4"
function formatDay(date: string): string {
  const weekday = WEEKDAY_FORMAT.format(new Date(`${date}T00:00:00Z`));

  return `${weekday} ${Number(date.slice(8))}`;
}

interface ForecastStripProps {
  weather: WeatherStatus;
  tripDates: string[];
}

// The forecast for each day of the trip that has one.
function ForecastStrip({ weather, tripDates }: ForecastStripProps) {
  if (weather.status === "unavailable") {
    // Only worth saying for trips still ahead.
    return tripDates[0] > getTodayDate() ? (
      <p className="mt-4 text-xs text-slate-500">
        The weather forecast shows up here about two weeks before your trip.
      </p>
    ) : null;
  }

  if (weather.status === "loading") {
    return <p className="mt-4 text-xs text-slate-500">Loading forecast…</p>;
  }

  if (weather.status === "error") {
    return (
      <p className="mt-4 text-xs text-slate-500">
        The forecast isn't available right now.
      </p>
    );
  }

  const days = tripDates
    .map((date) => weather.byDate[date])
    .filter((day) => day !== undefined);

  if (days.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Forecast">
        {days.map((day) => (
          <li
            key={day.date}
            className="w-20 shrink-0 border bg-white px-2 py-2 text-center"
            title={describeWeather(day)}
          >
            <span className="block text-xs text-slate-500">
              {formatDay(day.date)}
            </span>
            <span className="mt-1 block text-xl" aria-label={day.label}>
              {day.icon}
            </span>
            <span className="block text-sm font-medium text-slate-900">
              {day.maxTemp}°{" "}
              <span className="font-normal text-slate-500">{day.minTemp}°</span>
            </span>
            {day.rainChance !== null && day.rainChance >= 20 && (
              <span className="block text-xs text-sky-700">
                {day.rainChance}% rain
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-1 text-[11px] text-slate-400">
        Forecast by{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Open-Meteo
        </a>
      </p>
    </div>
  );
}

export default ForecastStrip;
