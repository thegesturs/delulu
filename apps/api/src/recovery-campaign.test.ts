import { RECOVERY_CAMPAIGN } from "@delulu/services";
import { describe, expect, it } from "vitest";
import {
  parseRecoveryCampaignCommand,
  validateRecoveryCampaignDatabaseUrl,
} from "./recovery-campaign";

describe("recovery campaign command", () => {
  it("defaults to a read-only preview", () => {
    expect(parseRecoveryCampaignCommand([])).toEqual({ mode: "preview" });
  });

  it("requires the campaign identifier before execution", () => {
    expect(() => parseRecoveryCampaignCommand(["--execute"])).toThrow(
      `--confirm=${RECOVERY_CAMPAIGN.id}`
    );
    expect(
      parseRecoveryCampaignCommand([
        "--execute",
        `--confirm=${RECOVERY_CAMPAIGN.id}`,
      ])
    ).toEqual({
      mode: "execute",
      confirmation: RECOVERY_CAMPAIGN.id,
    });
  });

  it("refuses local and non-Postgres targets", () => {
    expect(() =>
      validateRecoveryCampaignDatabaseUrl(
        "postgres://delulu:delulu@localhost:5432/delulu"
      )
    ).toThrow("cannot target a local database");
    expect(() =>
      validateRecoveryCampaignDatabaseUrl("https://db.example.com/delulu")
    ).toThrow("must use PostgreSQL");
  });
});
