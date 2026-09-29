import { useEffect, useId, useState } from "react";
import cities from "../data/cities";
import type { CityInfo } from "../data/types";
import { searchCities } from "../utils/api";

const MAX_SUGGESTIONS = 8;
const MIN_REMOTE_QUERY_LENGTH = 2;
const SEARCH_DELAY_MS = 250;

interface CitySearchProps {
  id: string;
  className?: string;
  // Shown in the box when it first appears, e.g. after choosing a destination card.
  initialCity?: CityInfo | null;
  onSelect: (city: CityInfo | null) => void;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function formatCity(city: CityInfo): string {
  return city.country ? `${city.name}, ${city.country}` : city.name;
}

// Built-in cities have their own photos and hand-picked places, so a search
// result for one of them is swapped for the built-in version.
function preferBuiltIn(city: CityInfo): CityInfo {
  return (
    cities.find(
      (builtIn) => normalize(builtIn.name) === normalize(city.name),
    ) ?? city
  );
}

function matchBuiltInCities(query: string): CityInfo[] {
  const text = normalize(query);

  return cities.filter((city) => normalize(city.name).startsWith(text));
}

function CitySearch({
  id,
  className = "",
  initialCity = null,
  onSelect,
}: CitySearchProps) {
  const listId = useId();

  const [query, setQuery] = useState(() =>
    initialCity ? formatCity(initialCity) : "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [remote, setRemote] = useState<{
    query: string;
    cities: CityInfo[];
  } | null>(null);

  const trimmed = query.trim();

  // Ask the server once typing pauses; cancel requests that are out of date.
  useEffect(() => {
    if (trimmed.length < MIN_REMOTE_QUERY_LENGTH) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      searchCities(trimmed, controller.signal)
        .then((results) => setRemote({ query: trimmed, cities: results }))
        .catch((error: Error) => {
          // Without the server (e.g. plain `npm run dev`) built-in cities still work.
          if (error.name !== "AbortError") {
            setRemote({ query: trimmed, cities: [] });
          }
        });
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const remoteCities =
    remote?.query === trimmed ? remote.cities.map(preferBuiltIn) : [];

  const suggestions = trimmed
    ? [...matchBuiltInCities(trimmed), ...remoteCities]
        .filter(
          (city, index, all) =>
            all.findIndex((other) => other.id === city.id) === index,
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];

  const isSearching =
    trimmed.length >= MIN_REMOTE_QUERY_LENGTH && remote?.query !== trimmed;

  const showList = isOpen && trimmed.length > 0;

  function choose(city: CityInfo) {
    setQuery(formatCity(city));
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(city);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);

      if (suggestions.length > 0) {
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex(
          (index) => (index + step + suggestions.length) % suggestions.length,
        );
      }
    } else if (event.key === "Enter" && showList && activeIndex >= 0) {
      // Choose the highlighted city instead of submitting the form.
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        placeholder="Search for a city"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
          onSelect(null);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent py-1 text-slate-900 outline-none placeholder:text-slate-500"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full left-0 z-20 mt-4 w-full min-w-64 border bg-white py-1 text-left text-slate-900 shadow-xl"
        >
          {suggestions.map((city, index) => (
            <li
              key={city.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // mousedown keeps the input from blurring before the choice registers.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(city);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer px-4 py-2 ${
                index === activeIndex ? "bg-slate-100" : ""
              }`}
            >
              <span className="font-medium">{city.name}</span>
              {city.country && (
                <span className="text-slate-500">, {city.country}</span>
              )}
            </li>
          ))}

          {suggestions.length === 0 && (
            <li className="px-4 py-2 text-sm text-slate-500">
              {isSearching ? "Searching…" : "No cities found"}
            </li>
          )}

          {suggestions.length > 0 && isSearching && (
            <li className="px-4 py-2 text-xs text-slate-400">
              Looking for more cities…
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default CitySearch;
