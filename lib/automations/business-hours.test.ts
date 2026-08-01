import { describe, it, expect } from "vitest";
import { isWithinBusinessHours, type BusinessHourRow } from "./business-hours";

// A normal Mon-Fri 09:00-18:00 week, closed weekends.
const weekdayHours: BusinessHourRow[] = [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
  day_of_week,
  open_time: "09:00:00",
  close_time: "18:00:00",
  is_closed: day_of_week === 0 || day_of_week === 6,
}));

describe("isWithinBusinessHours", () => {
  it("is true for a weekday during open hours (UTC org)", () => {
    // 2026-08-04 is a Tuesday.
    const tuesdayNoon = new Date("2026-08-04T12:00:00Z");
    expect(isWithinBusinessHours(weekdayHours, tuesdayNoon, "UTC")).toBe(true);
  });

  it("is false for a weekday before opening", () => {
    const tuesdayEarly = new Date("2026-08-04T07:00:00Z");
    expect(isWithinBusinessHours(weekdayHours, tuesdayEarly, "UTC")).toBe(false);
  });

  it("is false for a weekday after closing", () => {
    const tuesdayLate = new Date("2026-08-04T19:00:00Z");
    expect(isWithinBusinessHours(weekdayHours, tuesdayLate, "UTC")).toBe(false);
  });

  it("is false on a closed weekend day even during 'open' hours", () => {
    // 2026-08-02 is a Sunday.
    const sundayNoon = new Date("2026-08-02T12:00:00Z");
    expect(isWithinBusinessHours(weekdayHours, sundayNoon, "UTC")).toBe(false);
  });

  it("is false when no row exists for that day of week", () => {
    const mondayOnly: BusinessHourRow[] = [{ day_of_week: 1, open_time: "09:00:00", close_time: "18:00:00", is_closed: false }];
    const tuesdayNoon = new Date("2026-08-04T12:00:00Z");
    expect(isWithinBusinessHours(mondayOnly, tuesdayNoon, "UTC")).toBe(false);
  });

  it("respects a non-UTC timezone", () => {
    // 2026-08-04T23:30:00Z is Tuesday 23:30 UTC, but 02:30 Wednesday in
    // Istanbul (UTC+3) — outside 09:00-18:00 there, even though it'd be
    // a valid time if read as naive UTC-Tuesday.
    const lateUtc = new Date("2026-08-04T23:30:00Z");
    expect(isWithinBusinessHours(weekdayHours, lateUtc, "Europe/Istanbul")).toBe(false);
  });
});
