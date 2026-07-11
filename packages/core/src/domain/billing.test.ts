import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import { canInitiateBillingTransfer, transferIsExpired } from "./billing";

describe("billing domain", () => {
  it("restricts transfer initiation to an owner or the current payer", () => {
    expect(
      canInitiateBillingTransfer({
        actorUserId: "owner",
        currentBillingOwnerUserId: "payer",
        actorRole: "owner",
      })
    ).toBe(true);
    expect(
      canInitiateBillingTransfer({
        actorUserId: "payer",
        currentBillingOwnerUserId: "payer",
        actorRole: "viewer",
      })
    ).toBe(true);
    expect(
      canInitiateBillingTransfer({
        actorUserId: "admin",
        currentBillingOwnerUserId: "payer",
        actorRole: "admin",
      })
    ).toBe(false);
  });

  it("expires acceptance at the boundary", () => {
    expect(
      transferIsExpired(
        DateTime.makeUnsafe("2026-07-11T00:00:00Z"),
        DateTime.makeUnsafe("2026-07-11T00:00:00Z")
      )
    ).toBe(true);
  });
});
