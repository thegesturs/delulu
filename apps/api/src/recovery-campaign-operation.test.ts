import { describe, expect, it } from "vitest";
import { handleRecoveryCampaignOperation } from "./index";

const operationRequest = (headers?: HeadersInit) =>
  new Request("https://api.delulu.social/__ops/recovery-campaign/execute", {
    method: "POST",
    headers,
  });

describe("recovery campaign operation boundary", () => {
  it("is unavailable without its ephemeral bearer token", async () => {
    const response = await handleRecoveryCampaignOperation(
      operationRequest(),
      {}
    );

    expect(response?.status).toBe(404);
  });

  it("is unavailable to self-hosted deployments", async () => {
    const response = await handleRecoveryCampaignOperation(
      operationRequest({ authorization: "Bearer recovery-token" }),
      {
        DELULU_DEPLOYMENT_MODE: "self_hosted",
        RECOVERY_CAMPAIGN_TOKEN: "recovery-token",
      }
    );

    expect(response?.status).toBe(404);
  });

  it("requires the exact campaign confirmation before executing", async () => {
    const response = await handleRecoveryCampaignOperation(
      operationRequest({ authorization: "Bearer recovery-token" }),
      {
        RECOVERY_CAMPAIGN_TOKEN: "recovery-token",
      }
    );

    expect(response?.status).toBe(400);
    await expect(response?.json()).resolves.toEqual({
      error: "Confirmation is missing",
    });
  });
});
