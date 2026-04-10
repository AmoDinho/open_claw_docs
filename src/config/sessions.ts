export interface SessionWindow {
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export const DEFAULT_TIMEZONE = "Africa/Johannesburg";

export const SESSION_WINDOWS: SessionWindow[] = [
  {
    name: "Frankfurt",
    startHour: 7,
    startMinute: 0,
    endHour: 9,
    endMinute: 0,
  },
  {
    name: "London",
    startHour: 9,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
  },
  {
    name: "NewYork",
    startHour: 14,
    startMinute: 30,
    endHour: 17,
    endMinute: 0,
  },
];
