import { describe, expect, it } from "vitest";
import worker, { type Env } from "./index";

const env = {
  WHATSAPP_VERIFY_TOKEN: "verify-me",
} satisfies Env;

const request = (path: string, init?: RequestInit) =>
  worker.fetch(new Request(`https://staging.example${path}`, init), env);

describe("WhatsApp staging webhook", () => {
  it("returns a health response without exposing configuration", async () => {
    const response = await request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: "whatsapp-webhook",
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
    const response = await worker.fetch(
      new Request(
        "https://staging.example/v1/providers/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123456"
      ),
      {}
    );

    expect(response.status).toBe(503);
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
