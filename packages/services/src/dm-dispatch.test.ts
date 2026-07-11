import { describe, expect, it } from "vitest";
import { dmSoftLimit } from "./dm-dispatch";

describe("DM soft overage", () => {
  it("allows exactly ten percent above finite plan limits", () => {
    expect(dmSoftLimit(1000)).toBe(1100);
    expect(dmSoftLimit(1)).toBe(2);
  });

  it("preserves unlimited plans", () => {
    expect(dmSoftLimit(-1)).toBe(-1);
  });
});
