const MINUTES_PER_DAY = 24 * 60;

export const DURATION_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300, 360];

export const TRAVEL_TIME_OPTIONS = [0, 15, 30, 45, 60];

// Walks this short don't need their own travel time.
const NEGLIGIBLE_WALK_MINUTES = 5;

// Rounds an estimated walk up to the nearest travel-time option (at most 1 hour).
export function toTravelTimeOption(walkMinutes: number): number {
  if (walkMinutes <= NEGLIGIBLE_WALK_MINUTES) {
    return 0;
  }

  return (
    TRAVEL_TIME_OPTIONS.find((option) => option >= walkMinutes) ??
    TRAVEL_TIME_OPTIONS[TRAVEL_TIME_OPTIONS.length - 1]
  );
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

export function isWithinSameDay(startTime: string, duration: number): boolean {
  return timeToMinutes(startTime) + duration <= MINUTES_PER_DAY;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;

  const mins = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

// Returns the first free 15-minute slot at or after the preferred time,
// falling back to the first free slot of the day.
export function findAvailableTime(
  preferredTime: string,
  isAvailable: (time: string) => boolean,
): string {
  const slots: string[] = [];

  for (let minutes = 0; minutes < MINUTES_PER_DAY; minutes += 15) {
    slots.push(minutesToTime(minutes));
  }

  const preferred = timeToMinutes(preferredTime);

  return (
    slots.find(
      (slot) => timeToMinutes(slot) >= preferred && isAvailable(slot),
    ) ??
    slots.find(isAvailable) ??
    preferredTime
  );
}
