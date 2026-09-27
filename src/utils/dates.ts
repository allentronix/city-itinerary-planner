export function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDate(): string {
  return formatDateValue(new Date());
}

export const MAX_TRIP_DAYS = 30;

function isValidDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return formatDateValue(new Date(`${value}T00:00:00`)) === value;
}

// Pass the trip's current start date when editing, so a trip that has
// already started can keep its original start date.
export function getEarliestStartDate(currentStartDate?: string): string {
  const today = getTodayDate();

  return currentStartDate && currentStartDate < today
    ? currentStartDate
    : today;
}

export function validateTripDates(
  startDate: string,
  endDate: string,
  currentStartDate?: string,
): string | null {
  if (!startDate || !endDate) {
    return "Please choose both dates.";
  }

  if (!isValidDateValue(startDate) || !isValidDateValue(endDate)) {
    return "Please choose valid dates.";
  }

  if (startDate < getEarliestStartDate(currentStartDate)) {
    return "Start date can't be in the past.";
  }

  if (endDate < getTodayDate()) {
    return "End date can't be in the past.";
  }

  if (endDate < startDate) {
    return "End date must be on or after the start date.";
  }

  if (getTripDates(startDate, endDate).length > MAX_TRIP_DAYS) {
    return `Trips can be at most ${MAX_TRIP_DAYS} days long.`;
  }

  return null;
}

export function getTripDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];

  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    dates.push(formatDateValue(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export interface TripDay {
  date: string;
  label: string;
}

export function formatShortDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getTripDays(startDate: string, endDate: string): TripDay[] {
  return getTripDates(startDate, endDate).map((date, index) => ({
    date,
    label: `Day ${index + 1} · ${formatShortDate(date)}`,
  }));
}

export function formatFullDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWeekdayDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// e.g. "Oct 3 – Oct 7, 2026", or "Dec 30, 2026 – Jan 2, 2027" across years.
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const sameYear = start.getFullYear() === end.getFullYear();

  const startText = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endText = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startText} – ${endText}`;
}
