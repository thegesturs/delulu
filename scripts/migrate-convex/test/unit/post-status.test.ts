import { describe, expect, it } from "vitest";
import { migratedPostStatus } from "../../src/transform/post-status";

describe("migratedPostStatus", () => {
  const cases: {
    name: string;
    input: Parameters<typeof migratedPostStatus>[0];
    expected: string;
  }[] = [
    {
      name: "all pending + unscheduled + no review → draft",
      input: {
        targetStatuses: ["pending", "pending"],
        anyScheduled: false,
        overlay: undefined,
      },
      expected: "draft",
    },
    {
      name: "no targets, no review → draft",
      input: { targetStatuses: [], anyScheduled: false, overlay: undefined },
      expected: "draft",
    },
    {
      name: "pending + scheduled → scheduled (not draft)",
      input: {
        targetStatuses: ["pending"],
        anyScheduled: true,
        overlay: undefined,
      },
      expected: "scheduled",
    },
    {
      name: "pending review overlay → pending_review even when unscheduled",
      input: {
        targetStatuses: ["pending"],
        anyScheduled: false,
        overlay: "pending",
      },
      expected: "pending_review",
    },
    {
      name: "rejected review overlay → changes_requested",
      input: {
        targetStatuses: ["pending"],
        anyScheduled: false,
        overlay: "rejected",
      },
      expected: "changes_requested",
    },
    {
      name: "approved overlay with all published → published",
      input: {
        targetStatuses: ["published"],
        anyScheduled: false,
        overlay: "approved",
      },
      expected: "published",
    },
    {
      name: "all published → published",
      input: {
        targetStatuses: ["published", "published"],
        anyScheduled: false,
        overlay: undefined,
      },
      expected: "published",
    },
    {
      name: "all failed → failed",
      input: {
        targetStatuses: ["failed"],
        anyScheduled: false,
        overlay: undefined,
      },
      expected: "failed",
    },
    {
      name: "mixed published + failed → partially_failed",
      input: {
        targetStatuses: ["published", "failed"],
        anyScheduled: false,
        overlay: undefined,
      },
      expected: "partially_failed",
    },
    {
      name: "any publishing → publishing",
      input: {
        targetStatuses: ["publishing", "pending"],
        anyScheduled: true,
        overlay: undefined,
      },
      expected: "publishing",
    },
  ];

  for (const { name, input, expected } of cases) {
    it(name, () => {
      expect(migratedPostStatus(input)).toBe(expected);
    });
  }
});
