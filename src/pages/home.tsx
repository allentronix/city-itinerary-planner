import { useEffect, useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import cities from "../data/cities";
import type { City, CityInfo } from "../data/types";
import CitySearch from "../components/city-search";
import { useInView } from "../hooks/use-in-view";
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
  // Changing this remounts the search box so it shows a city chosen from the cards.
  const [searchKey, setSearchKey] = useState(0);

  // The "scroll down" hint fades away once the visitor starts scrolling.
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 40);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Popular destinations fade in as they scroll into view.
  const { ref: destinationsRef, inView: destinationsInView } =
    useInView<HTMLElement>();

  function scrollToDestinations() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document
      .getElementById("destinations")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }
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

  // Choosing a destination card fills in "Where"; with dates already picked it opens the city.
  function handleDestination(destination: City) {
    const { id, name, country } = destination;
    const chosen: CityInfo = { id, name, country };

    setCity(chosen);
    setError("");

    if (startDate && endDate && !validateTripDates(startDate, endDate)) {
      navigate(getTripUrl(chosen, { startDate, endDate }));
      return;
    }

    // Show the chosen city in the search box, then open the calendar for the dates.
    setSearchKey((key) => key + 1);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => document.getElementById("trip-dates")?.click());
  }

  return (
    <main>
      <section
        className="relative flex min-h-svh items-center bg-slate-800 bg-cover bg-center pt-20 pb-28"
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
                  {draft.items.length === 1 ? "place" : "places"} · not saved
                  yet
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
                key={searchKey}
                initialCity={city}
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

        <button
          type="button"
          onClick={scrollToDestinations}
          tabIndex={hasScrolled ? -1 : 0}
          aria-hidden={hasScrolled}
          className={`absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-sm font-medium text-white/85 transition-opacity duration-300 hover:text-white ${
            hasScrolled ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          Popular destinations
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-6 motion-safe:animate-bounce"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </section>

      <section
        id="destinations"
        ref={destinationsRef}
        className={`mx-auto max-w-6xl px-6 py-16 transition duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
          destinationsInView
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        }`}
      >
        <h2 className="font-serif text-3xl tracking-tight">
          Popular destinations
        </h2>
        <p className="mt-2 text-slate-600">
          Hand-picked sights, restaurants and coffee shops to get you started.
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {cities.map((destination, index) => (
            <li
              key={destination.id}
              // Cards follow one after another as the section fades in.
              style={{ transitionDelay: `${150 + index * 60}ms` }}
              className={`transition duration-500 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
                destinationsInView
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => handleDestination(destination)}
                aria-label={`Plan a trip to ${destination.name}, ${destination.country}`}
                className="group block w-full border bg-white text-left"
              >
                <span className="block overflow-hidden">
                  <img
                    src={destination.image}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="block p-3">
                  <span className="block font-serif text-lg">
                    {destination.name}
                  </span>
                  <span className="block text-sm text-slate-500">
                    {destination.country} · {destination.places.length} places
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Home;
