import { describe, expect, it } from "vitest";
import {
  filterCalendarOccurrences,
  getCalendarOccurrences,
} from "./holiday-calendar";

describe("holiday calendar occurrences", () => {
  it("resolves fixed and weekday-based dates from independent known examples", () => {
    const occurrences = getCalendarOccurrences(2026);

    expect(
      occurrences.find((event) => event.id === "new-years-day")?.date
    ).toBe("2026-01-01");
    expect(
      occurrences.find((event) => event.id === "us-thanksgiving")?.date
    ).toBe("2026-11-26");
    expect(
      occurrences.find((event) => event.id === "us-memorial-day")?.date
    ).toBe("2026-05-25");
  });

  it("filters deterministically by country, category, search, month, and upcoming date", () => {
    const occurrences = getCalendarOccurrences(2026);
    const filtered = filterCalendarOccurrences(occurrences, {
      country: "US",
      category: "national",
      query: "day",
      month: 7,
      upcomingFrom: "2026-07-01",
    });

    expect(filtered.map((event) => event.id)).toEqual(["us-independence-day"]);
  });

  it("keeps global observances visible in country views", () => {
    const occurrences = getCalendarOccurrences(2026);
    const filtered = filterCalendarOccurrences(occurrences, {
      country: "IN",
      query: "women",
    });

    expect(filtered.map((event) => event.id)).toEqual([
      "international-womens-day",
    ]);
  });
});
