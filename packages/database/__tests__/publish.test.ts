import { describe, expect, it } from "vitest";
import { derivePublishStatus } from "../convex/publish";

describe("derivePublishStatus", () => {
  it("returns undefined for an empty run", () => {
    expect(derivePublishStatus([])).toBeUndefined();
  });

  it("all published → PUBLISHED", () => {
    expect(derivePublishStatus(["PUBLISHED", "PUBLISHED"])).toBe("PUBLISHED");
  });

  it("all failed → FAILED (incl. DEAD_LETTER)", () => {
    expect(derivePublishStatus(["FAILED", "DEAD_LETTER"])).toBe("FAILED");
  });

  it("terminal mix of success and failure → PARTIAL", () => {
    expect(derivePublishStatus(["PUBLISHED", "FAILED"])).toBe("PARTIAL");
    expect(derivePublishStatus(["PUBLISHED", "DEAD_LETTER"])).toBe("PARTIAL");
  });

  it("any in-flight job → PROCESSING/QUEUED, never PARTIAL", () => {
    // A success already recorded but another still running must NOT read PARTIAL.
    expect(derivePublishStatus(["PUBLISHED", "PROCESSING"])).toBe("PROCESSING");
    expect(derivePublishStatus(["PUBLISHED", "QUEUED"])).toBe("QUEUED");
    expect(derivePublishStatus(["QUEUED", "QUEUED"])).toBe("QUEUED");
    expect(derivePublishStatus(["PROCESSING", "FAILED"])).toBe("PROCESSING");
  });
});
