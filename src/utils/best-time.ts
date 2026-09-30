export type TimeOfDay = "morning" | "afternoon" | "evening";

interface BestTimeInfo {
  startTime: string;
  timeOfDay: TimeOfDay;
}

const BEST_TIMES: Record<string, BestTimeInfo> = {
  sunrise: { startTime: "06:30", timeOfDay: "morning" },
  "early morning": { startTime: "08:00", timeOfDay: "morning" },
  morning: { startTime: "09:00", timeOfDay: "morning" },
  "late morning": { startTime: "10:30", timeOfDay: "morning" },
  lunch: { startTime: "12:30", timeOfDay: "afternoon" },
  afternoon: { startTime: "14:00", timeOfDay: "afternoon" },
  "late afternoon": { startTime: "16:00", timeOfDay: "afternoon" },
  sunset: { startTime: "18:30", timeOfDay: "evening" },
  evening: { startTime: "19:00", timeOfDay: "evening" },
  dinner: { startTime: "19:30", timeOfDay: "evening" },
  "late evening": { startTime: "21:00", timeOfDay: "evening" },
};

// The choices offered when adding your own place, e.g. "Late morning".
export const BEST_TIME_OPTIONS = Object.keys(BEST_TIMES).map(
  (key) => key.charAt(0).toUpperCase() + key.slice(1),
);

const DEFAULT_BEST_TIME: BestTimeInfo = {
  startTime: "09:00",
  timeOfDay: "morning",
};

function getBestTimeInfo(bestTime: string): BestTimeInfo {
  return BEST_TIMES[bestTime.trim().toLowerCase()] ?? DEFAULT_BEST_TIME;
}

export function getSuggestedStartTime(bestTime: string): string {
  return getBestTimeInfo(bestTime).startTime;
}

export function getTimeOfDay(bestTime: string): TimeOfDay {
  return getBestTimeInfo(bestTime).timeOfDay;
}
