import { DEFAULT_TIMEZONE, SESSION_WINDOWS } from "../config/sessions.js";
import type { SessionValidation } from "../data/types.js";

function getLocalTimeParts(timestamp: Date, timezone: string): {
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(timestamp);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return { hour, minute };
}

export function validateSession(timestamp: Date, timezone = DEFAULT_TIMEZONE): SessionValidation {
  const { hour, minute } = getLocalTimeParts(timestamp, timezone);
  const totalMinutes = hour * 60 + minute;

  const activeSessionNames = SESSION_WINDOWS.filter((window) => {
    const start = window.startHour * 60 + window.startMinute;
    const end = window.endHour * 60 + window.endMinute;
    return totalMinutes >= start && totalMinutes <= end;
  }).map((window) => window.name);

  return {
    isValid: activeSessionNames.length > 0,
    activeSessionNames,
    timestamp: timestamp.toISOString(),
    timezone,
  };
}
