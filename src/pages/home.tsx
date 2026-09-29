import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { CityInfo } from "../data/types";
import CitySearch from "../components/city-search";
import DateRangePicker from "../components/date-range-picker";
import { Button } from "../components/ui/button";
import {
  MAX_TRIP_DAYS,
  formatDateRange,
  getTodayDate,
  validateTripDates,
} from "../utils/dates";
import { clearDraft, loadDraft } from "../utils/draft-trip";
import { getTripUrl } from "../utils/trip-url";

const LABEL_CLASS =
  "block text-xs font-medium tracking-wider text-slate-800 uppercase";

function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState<CityInfo | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const today = getTodayDate();

  // An unsaved plan from earlier, offered back unless its dates have passed.
  const [draft, setDraft] = useState(() => {
    const saved = loadDraft();

    return saved && saved.items.length > 0 && saved.trip.endDate >= today
      ? saved
      : null;
  });

  function handleExplore(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!city) {
      setError("Please choose a city from the list.");
      return;
    }

    const dateError = validateTripDates(startDate, endDate);

    if (dateError) {
      setError(dateError);
      return;
    }

    navigate(getTripUrl(city, { startDate, endDate }));
  }

  return (
    <main
      className="relative flex min-h-svh items-center bg-slate-800 bg-cover bg-center pt-20 pb-16"
      style={{ backgroundImage: "url('/hero.webp')" }}
    >
      <div
        className="absolute inset-0 bg-linear-to-b from-black/50 via-black/30 to-black/50"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-6">
        <h1 className="max-w-3xl font-serif text-5xl tracking-tight text-white sm:text-7xl">
          Plan your perfect city trip
        </h1>

        {draft && (
          <div className="mt-8 flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-3 bg-white/95 px-5 py-4 shadow-lg">
            <p className="flex-1 text-slate-900">
              <span className="font-medium">
                Continue your {draft.city.name} plan?
              </span>
              <span className="block text-sm text-slate-500">
                {formatDateRange(draft.trip.startDate, draft.trip.endDate)} ·{" "}
                {draft.items.length}{" "}
                {draft.items.length === 1 ? "place" : "places"} · not saved yet
              </span>
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => navigate(getTripUrl(draft.city, draft.trip))}
              >
                Continue
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  clearDraft();
                  setDraft(null);
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleExplore}
          className="mt-10 flex flex-col bg-slate-50 shadow-xl md:flex-row"
        >
          <div className="bg-white px-6 py-4 md:flex-[1.5]">
            <label className={LABEL_CLASS} htmlFor="city">
              Where
            </label>
            <CitySearch
              id="city"
              className="mt-1"
              onSelect={(selected) => {
                setCity(selected);
                setError("");
              }}
            />
          </div>

          <div className="flex-1 border-t px-6 py-4 md:border-t-0">
            <label className={LABEL_CLASS} htmlFor="trip-dates">
              When
            </label>
            <DateRangePicker
              id="trip-dates"
              className="mt-1"
              compact
              startDate={startDate}
              endDate={endDate}
              minDate={today}
              maxDays={MAX_TRIP_DAYS}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setError("");
              }}
            />
          </div>

          <div className="flex items-center p-3">
            <Button
              type="submit"
              className="h-12 w-full bg-emerald-600 px-8 text-base text-white hover:bg-emerald-700 md:w-auto"
            >
              Search
            </Button>
          </div>
        </form>

        {error && (
          <p className="mt-3 inline-block bg-white px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

export default Home;
