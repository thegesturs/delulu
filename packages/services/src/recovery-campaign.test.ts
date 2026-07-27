import { PROD_PRODUCT_IDS, PROD_PRODUCT_IDS_INR } from "@delulu/payments";
import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  isRecoveryDiscountCompatible,
  RECOVERY_CAMPAIGN,
  recoveryCampaignEmail,
  recoveryDiscountSpec,
  summarizeRecoveryCampaignAudience,
} from "./recovery-campaign";

describe("recovery campaign offer", () => {
  it("grants 100% off for exactly two monthly billing cycles", () => {
    const spec = recoveryDiscountSpec(42);
    const monthlyProductIds = [
      ...new Set([
        ...Object.values(PROD_PRODUCT_IDS).map(({ monthly }) => monthly),
        ...Object.values(PROD_PRODUCT_IDS_INR).map(({ monthly }) => monthly),
      ]),
    ].sort();
    const yearlyProductIds = Object.values(PROD_PRODUCT_IDS).map(
      ({ yearly }) => yearly
    );

    expect(spec).toMatchObject({
      amount: 10_000,
      code: "DELULU2MONTHS",
      subscription_cycles: 2,
      type: "percentage",
      usage_limit: 42,
    });
    expect(spec.restricted_to).toEqual(monthlyProductIds);
    expect(spec.restricted_to).not.toEqual(
      expect.arrayContaining(yearlyProductIds)
    );
  });

  it("only reuses an existing code when every safety limit matches", () => {
    const compatible = {
      ...recoveryDiscountSpec(42),
      discount_id: "dsc_recovery",
    };

    expect(isRecoveryDiscountCompatible(compatible, 42)).toBe(true);
    expect(
      isRecoveryDiscountCompatible(
        { ...compatible, subscription_cycles: null },
        42
      )
    ).toBe(false);
    expect(
      isRecoveryDiscountCompatible(
        { ...compatible, expires_at: RECOVERY_CAMPAIGN.endsAt },
        42
      )
    ).toBe(false);
  });

  it("renders the apology, offer, and one-on-one call without trusting names", () => {
    const email = recoveryCampaignEmail('<Swaraj & "friends">');

    expect(email.subject).toBe("We’re sorry — your next 2 months are on us");
    expect(email.text).toContain("DELULU2MONTHS");
    expect(email.text).toContain(RECOVERY_CAMPAIGN.bookingUrl);
    expect(email.html).toContain("&lt;Swaraj");
    expect(email.html).not.toContain('<Swaraj & "friends">');
  });

  it("tells active subscribers their two free months were applied automatically", () => {
    const email = recoveryCampaignEmail("Ada", "subscription-extension");

    expect(email.text).toContain("already been applied");
    expect(email.text).not.toContain(RECOVERY_CAMPAIGN.discountCode);
    expect(email.html).toContain("active subscription");
    expect(email.html).not.toContain(RECOVERY_CAMPAIGN.billingUrl);
  });

  it("extends calendar months without overflowing month-end dates", () => {
    expect(addCalendarMonths("2026-01-31T10:15:00.000Z", 1)).toBe(
      "2026-02-28T10:15:00.000Z"
    );
    expect(addCalendarMonths("2026-07-27T10:15:00.000Z", 2)).toBe(
      "2026-09-27T10:15:00.000Z"
    );
  });

  it("uses one audience definition for preview and delivery eligibility", () => {
    const preview = summarizeRecoveryCampaignAudience([
      {
        id: "eligible",
        email: "new-user@delulu.social",
        name: "New User",
        lifecycleEnabled: true,
        deliveryStatus: null,
        activeSubscription: true,
        providerSubscriptionId: "sub_active",
      },
      {
        id: "opted-out",
        email: "quiet@delulu.social",
        name: null,
        lifecycleEnabled: false,
        deliveryStatus: null,
        activeSubscription: false,
        providerSubscriptionId: null,
      },
      {
        id: "test-address",
        email: "fixture@example.com",
        name: null,
        lifecycleEnabled: true,
        deliveryStatus: null,
        activeSubscription: false,
        providerSubscriptionId: null,
      },
      {
        id: "sent",
        email: "sent@delulu.social",
        name: null,
        lifecycleEnabled: true,
        deliveryStatus: "sent",
        activeSubscription: false,
        providerSubscriptionId: null,
      },
    ]);

    expect(preview).toMatchObject({
      totalSignups: 4,
      eligibleRecipients: 2,
      remainingRecipients: 1,
      sentRecipients: 1,
      activeSubscribers: 1,
      optedOut: 1,
      missingOrInvalidEmail: 1,
    });
  });
});
