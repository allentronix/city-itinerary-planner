import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import cities from "../data/cities";
import DateRangePicker from "../components/date-range-picker";
import { Button } from "../components/ui/button";
import { MAX_TRIP_DAYS, getTodayDate, validateTripDates } from "../utils/dates";

const LABEL_CLASS =
  "block text-xs font-medium tracking-wider text-slate-800 uppercase";

const FIELD_CLASS = "mt-1 w-full bg-transparent text-slate-600 outline-none";

function Home() {
  const navigate = useNavigate();
  const [cityId, setCityId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const today = getTodayDate();

  function handleExplore(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cityId) {
      setError("Please choose a city.");
      return;
    }

    const dateError = validateTripDates(startDate, endDate);

    if (dateError) {
      setError(dateError);
      return;
    }

    const params = new URLSearchParams({ start: startDate, end: endDate });

    navigate(`/city/${cityId}?${params}`);
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

        <form
          onSubmit={handleExplore}
          className="mt-10 flex flex-col bg-slate-50 shadow-xl md:flex-row"
        >
          <div className="bg-white px-6 py-4 md:flex-[1.5]">
            <label className={LABEL_CLASS} htmlFor="city">
              Where
            </label>
            <select
              id="city"
              value={cityId}
              onChange={(event) => {
                setCityId(event.target.value);
                setError("");
              }}
              className={FIELD_CLASS}
            >
              <option value="">Choose a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.country}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 border-t px-6 py-4 md:border-t-0">
            <label className={LABEL_CLASS} htmlFor="trip-dates">
              When
            </label>
            <DateRangePicker
              id="trip-dates"
              className="mt-1"
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
