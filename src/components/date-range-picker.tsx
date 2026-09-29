import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { formatDateValue } from "../utils/dates";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface DateRangePickerProps {
  id: string;
  startDate: string;
  endDate: string;
  minDate: string;
  minEndDate?: string;
  maxDays: number;
  className?: string;
  // Smaller cells and spacing, for tight spots like the landing page.
  compact?: boolean;
  onChange: (startDate: string, endDate: string) => void;
}

// Tailwind classes for each size, plus the panel's approximate height, used to
// decide whether it fits below the field or should open above it.
const SIZES = {
  regular: {
    panel: "p-6",
    months: "gap-10",
    month: "w-64",
    title: "mb-4",
    weekday: "pb-2",
    grid: "gap-y-1",
    day: "size-9",
    nav: "size-8",
    estimatedHeight: 330,
  },
  compact: {
    panel: "p-4",
    months: "gap-6",
    month: "w-56",
    title: "mb-2 text-sm",
    weekday: "pb-1",
    grid: "gap-y-0.5",
    day: "size-8",
    nav: "size-7",
    estimatedHeight: 260,
  },
};

// Gap between the field and the panel.
const PANEL_OFFSET = 16;

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function addDays(value: string, days: number): string {
  const date = toDate(value);
  date.setDate(date.getDate() + days);

  return formatDateValue(date);
}

function getMonthStart(value: string): Date {
  const date = toDate(value);

  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(month: Date, count: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + count, 1);
}

// Leading nulls pad the first week so the month starts on the right weekday (Monday first).
function getMonthCells(month: Date): (string | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (string | null)[] = Array(leadingBlanks).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(formatDateValue(new Date(year, monthIndex, day)));
  }

  return cells;
}

function formatTriggerDate(value: string): string {
  return toDate(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function DateRangePicker({
  id,
  startDate,
  endDate,
  minDate,
  minEndDate = minDate,
  maxDays,
  className = "",
  compact = false,
  onChange,
}: DateRangePickerProps) {
  const size = compact ? SIZES.compact : SIZES.regular;

  const [isOpen, setIsOpen] = useState(false);
  // Opens above the field when there isn't room below it.
  const [opensUp, setOpensUp] = useState(false);
  const [hoverDate, setHoverDate] = useState("");
  const [focusedDate, setFocusedDate] = useState("");
  const [viewMonth, setViewMonth] = useState(() =>
    getMonthStart(startDate || minDate),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function open() {
    const initialDate = startDate || minDate;

    const field = containerRef.current?.getBoundingClientRect();

    if (field) {
      const needed = size.estimatedHeight + PANEL_OFFSET;
      const spaceBelow = window.innerHeight - field.bottom;

      setOpensUp(spaceBelow < needed && field.top > spaceBelow);
    }

    setViewMonth(getMonthStart(initialDate));
    setFocusedDate(initialDate);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setHoverDate("");
    triggerRef.current?.focus();
  }

  // Move keyboard focus to the focused day whenever it changes.
  useEffect(() => {
    if (isOpen && focusedDate) {
      panelRef.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${focusedDate}"]`)
        ?.focus();
    }
  }, [isOpen, focusedDate]);

  // Close when clicking outside the picker or pressing Escape.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isChoosingEnd = Boolean(startDate) && !endDate;

  const latestEndDate = startDate ? addDays(startDate, maxDays - 1) : "";

  // While choosing the end date, preview the range up to the hovered day.
  const rangeEnd =
    endDate ||
    (isChoosingEnd && hoverDate > startDate && hoverDate <= latestEndDate
      ? hoverDate
      : "");

  const canGoBack = viewMonth > getMonthStart(minDate);

  function isDisabled(date: string): boolean {
    if (date < minDate) {
      return true;
    }

    // Earlier days start a new range, so only limit days after the start.
    if (isChoosingEnd && date >= startDate) {
      return date < minEndDate || date > latestEndDate;
    }

    return false;
  }

  function handleSelect(date: string) {
    if (isDisabled(date)) {
      return;
    }

    setFocusedDate(date);

    if (!isChoosingEnd || date < startDate) {
      onChange(date, "");
      return;
    }

    onChange(startDate, date);
    close();
  }

  // One month is shown on small screens, two from the md breakpoint up.
  function getVisibleMonthCount(): number {
    return window.matchMedia("(min-width: 768px)").matches ? 2 : 1;
  }

  function moveFocus(days: number) {
    const nextDate = addDays(focusedDate || startDate || minDate, days);

    if (nextDate < minDate) {
      return;
    }

    const nextMonth = getMonthStart(nextDate);
    const lastVisibleMonth = addMonths(viewMonth, getVisibleMonthCount() - 1);

    if (nextMonth < viewMonth) {
      setViewMonth(nextMonth);
    } else if (nextMonth > lastVisibleMonth) {
      setViewMonth(addMonths(nextMonth, 1 - getVisibleMonthCount()));
    }

    setFocusedDate(nextDate);
    setHoverDate(nextDate);
  }

  function handleGridKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };

    if (event.key in moves) {
      event.preventDefault();
      moveFocus(moves[event.key]);
    }
  }

  // Keep exactly one day tabbable: the focused day if it's shown, otherwise the first of the month.
  const lastShownDate = formatDateValue(
    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 2, 0),
  );
  const tabbableDate =
    focusedDate >= formatDateValue(viewMonth) && focusedDate <= lastShownDate
      ? focusedDate
      : formatDateValue(viewMonth);

  function renderMonth(month: Date) {
    return (
      <div className={size.month}>
        <p className={`${size.title} text-center font-medium`}>
          {month.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="grid grid-cols-7 text-center text-xs text-gray-400">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} className={size.weekday}>
              {weekday}
            </span>
          ))}
        </div>

        <div
          className={`grid grid-cols-7 ${size.grid}`}
          onKeyDown={handleGridKeyDown}
        >
          {getMonthCells(month).map((date, index) => {
            if (!date) {
              return <span key={`blank-${index}`} />;
            }

            const isEdge = date === startDate || date === rangeEnd;
            const isInRange =
              Boolean(startDate && rangeEnd) &&
              date >= startDate &&
              date <= rangeEnd;
            const disabled = isDisabled(date);

            return (
              <div
                key={date}
                className={`flex justify-center ${isInRange ? "bg-slate-100" : ""}`}
              >
                <button
                  type="button"
                  data-date={date}
                  tabIndex={date === tabbableDate ? 0 : -1}
                  aria-disabled={disabled}
                  aria-label={toDate(date).toDateString()}
                  aria-pressed={isEdge}
                  onClick={() => handleSelect(date)}
                  onMouseEnter={() => setHoverDate(date)}
                  className={`${size.day} rounded-full text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                    isEdge
                      ? "bg-slate-900 text-white"
                      : disabled
                        ? "text-gray-300"
                        : "hover:bg-slate-200"
                  }`}
                >
                  {toDate(date).getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const triggerText = startDate
    ? `${formatTriggerDate(startDate)} – ${
        endDate ? formatTriggerDate(endDate) : "Add end date"
      }`
    : "Add dates";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => (isOpen ? close() : open())}
          className={`w-full py-1 text-left outline-none ${
            startDate ? "text-slate-900" : "text-slate-500"
          }`}
        >
          {triggerText}
        </button>

        {startDate && (
          <button
            type="button"
            aria-label="Clear dates"
            onClick={() => onChange("", "")}
            className="flex size-6 shrink-0 items-center justify-center bg-slate-200 text-sm text-slate-700 hover:bg-slate-300"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose dates"
          className={`absolute left-0 z-20 w-max border bg-white text-slate-900 shadow-xl ${size.panel} ${
            opensUp ? "bottom-full mb-4" : "top-full mt-4"
          }`}
          onMouseLeave={() => setHoverDate("")}
        >
          <div className={`relative flex ${size.months}`}>
            <button
              type="button"
              aria-label="Previous month"
              disabled={!canGoBack}
              onClick={() => setViewMonth((month) => addMonths(month, -1))}
              className={`absolute top-0 left-0 flex ${size.nav} -translate-y-1 items-center justify-center border hover:bg-slate-100 disabled:opacity-30`}
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth((month) => addMonths(month, 1))}
              className={`absolute top-0 right-0 flex ${size.nav} -translate-y-1 items-center justify-center border hover:bg-slate-100`}
            >
              ›
            </button>

            {renderMonth(viewMonth)}

            <div className="hidden md:block">
              {renderMonth(addMonths(viewMonth, 1))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
