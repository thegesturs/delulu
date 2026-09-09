import { describe, expect, it } from "vitest";
import { connectionIsVisible } from "./use-connection-reconciliation";

const accounts = [
  {
    platform: "LINKEDIN",
    profileId: "urn:li:organization:123",
    username: "company-page",
    displayName: "Company Page",
  },
  {
    platform: "TWITTER",
    profileId: "twitter-1",
    username: "@delulu",
    displayName: "Delulu",
  },
] as const;

describe("connectionIsVisible", () => {
  it("matches the callback provider and identity without handle punctuation", () => {
    expect(
      connectionIsVisible(accounts, "linkedin", null, "@company-page")
    ).toBe(true);
  });

  it("does not report ready for a different account on the same provider", () => {
    expect(
      connectionIsVisible(accounts, "linkedin", null, "another-page")
    ).toBe(false);
  });

  it("accepts any account for the provider when no identity is returned", () => {
    expect(connectionIsVisible(accounts, "twitter", null, null)).toBe(true);
  });

  it("uses the stable profile id before a potentially duplicate display name", () => {
    expect(
      connectionIsVisible(
        accounts,
        "linkedin",
        "urn:li:organization:456",
        "Company Page"
      )
    ).toBe(false);
  });
});
