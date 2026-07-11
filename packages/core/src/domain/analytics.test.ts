import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import { calculatePublishingStreak, compareInsightTotals } from "./analytics";

const instant = (value: string) => DateTime.makeUnsafe(value);

describe("analytics domain", () => {
  it("derives current and longest publishing streaks from distinct UTC days", () => {
    const streak = calculatePublishingStreak(
      [
        instant("2026-07-10T18:00:00Z"),
        instant("2026-07-10T08:00:00Z"),
        instant("2026-07-09T08:00:00Z"),
        instant("2026-07-08T08:00:00Z"),
        instant("2026-07-04T08:00:00Z"),
        instant("2026-07-03T08:00:00Z"),
      ],
      instant("2026-07-11T01:00:00Z")
    );
    expect(streak).toEqual({
      currentDays: 3,
      longestDays: 3,
      lastPublishedDate: "2026-07-10",
    });
  });

  it("computes real previous-period percentage changes", () => {
    expect(
      compareInsightTotals(
        {
          impressions: 150,
          reach: 20,
          engagements: 0,
          followersGained: 5,
          profileViews: 2,
        },
        {
          impressions: 100,
          reach: 10,
          engagements: 0,
          followersGained: 0,
          profileViews: 4,
        }
      )
    ).toEqual({
      impressions: 50,
      reach: 100,
      engagements: 0,
      followersGained: 100,
      profileViews: -50,
    });
  });
});
