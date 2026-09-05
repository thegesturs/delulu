import { describe, expect, it } from "vitest";
import { type Env, handleProviderIngress } from "./provider-ingress";

const env = {
  WHATSAPP_VERIFY_TOKEN: "verify-me",
} satisfies Env;

const request = (path: string, init?: RequestInit) =>
  handleProviderIngress(
    new Request(`https://api.example${path}`, init),
    env
  ).then((response) => {
    if (!response) {
      throw new Error("Expected an ingress response");
    }
    return response;
  });

describe("shared provider ingress", () => {
  it("passes ordinary API routes to the application", async () => {
    expect(
      await handleProviderIngress(
        new Request("https://api.example/v1/workspaces"),
        env
      )
    ).toBeNull();
  });
  it("leaves the existing readiness contract to the application", async () => {
    expect(
      await handleProviderIngress(
        new Request("https://api.example/health"),
        env
      )
    ).toBeNull();
  });

  it("returns a liveness response without exposing configuration", async () => {
    const response = await request("/live");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: "delulu-api",
      status: "ok",
    });
  });

  it("returns Meta's raw subscription challenge", async () => {
    const response = await request(
      "/v1/providers/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123456"
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("123456");
  });

  it("rejects an invalid verification token", async () => {
    const response = await request(
      "/v1/providers/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123456"
    );

    expect(response.status).toBe(403);
  });

  it("fails closed when the verification secret is missing", async () => {
    const response = await handleProviderIngress(
      new Request(
        "https://staging.example/v1/providers/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123456"
      ),
      {}
    );

    expect(response?.status).toBe(503);
  });

  it("does not acknowledge inbound messages before agent ingress is connected", async () => {
    const response = await request("/v1/providers/whatsapp/webhook", {
      method: "POST",
      body: "an intentionally unread body",
    });

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("300");
  });
});
