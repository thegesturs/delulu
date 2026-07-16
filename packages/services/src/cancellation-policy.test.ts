import { describe, expect, it } from "vitest";
import {
  CANCELLATION_CONFIRMATION,
  cancellationDeletionAt,
  canOfferMonthlySave,
  isCancellationReason,
} from "./cancellation-policy";

describe("monthly cancellation save eligibility", () => {
  const now = new Date("2026-07-14T00:00:00.000Z");

  it("offers one free monthly cycle only after 30 paid days", () => {
    expect(
      canOfferMonthlySave({
        billingPeriod: "MONTHLY",
        currentPeriodStart: new Date("2026-06-14T00:00:00.000Z"),
        saveAlreadyUsed: false,
        now,
      })
    ).toBe(true);
    expect(
      canOfferMonthlySave({
        billingPeriod: "MONTHLY",
        currentPeriodStart: new Date("2026-06-15T00:00:00.000Z"),
        saveAlreadyUsed: false,
        now,
      })
    ).toBe(false);
  });

  it("never automatically offers annual users or repeat redeemers", () => {
    expect(
      canOfferMonthlySave({
        billingPeriod: "YEARLY",
        currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
        saveAlreadyUsed: false,
        now,
      })
    ).toBe(false);
    expect(
      canOfferMonthlySave({
        billingPeriod: "MONTHLY",
        currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
        saveAlreadyUsed: true,
        now,
      })
    ).toBe(false);
  });

  it("uses an exact destructive confirmation and a 60-day recovery window", () => {
    expect(CANCELLATION_CONFIRMATION).toBe("CANCEL AND DELETE");
    expect(
      cancellationDeletionAt(new Date("2026-08-01T00:00:00.000Z"))
    ).toEqual(new Date("2026-09-30T00:00:00.000Z"));
  });

  it("accepts only provider-supported cancellation feedback", () => {
    expect(isCancellationReason("too_expensive")).toBe(true);
    expect(isCancellationReason("missing_features")).toBe(true);
    expect(isCancellationReason("not_a_real_reason")).toBe(false);
  });
});
