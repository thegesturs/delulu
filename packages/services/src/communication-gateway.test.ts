import { describe, expect, it } from "vitest";
import {
  describeCommunicationMedia,
  normalizeChannelSender,
  verifyCommunicationWebhook,
} from "./communication-gateway";

const bytesToHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

describe("communication webhook boundary", () => {
  it("describes media-only voice notes for agent submission", () => {
    expect(
      describeCommunicationMedia([
        {
          url: "https://media.example.test/note.ogg",
          mime_type: "audio/ogg",
          name: "note.ogg",
          transcript: "Here is the launch idea.",
        },
      ])
    ).toContain("Voice note: note.ogg (audio/ogg)");
    expect(
      describeCommunicationMedia([
        {
          url: "https://media.example.test/note.ogg",
          mime_type: "audio/ogg",
          transcript: "Here is the launch idea.",
        },
      ])
    ).toContain("Transcript:\nHere is the launch idea.");
  });

  it("accepts the exact signed body and rejects a changed body", async () => {
    const body = '{"id":"evt_1","type":"message.received"}';
    const secret = "test-webhook-secret";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const digest = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    const signature = `sha256=${bytesToHex(digest)}`;

    await expect(
      verifyCommunicationWebhook(body, signature, secret)
    ).resolves.toBe(true);
    await expect(
      verifyCommunicationWebhook(`${body} `, signature, secret)
    ).resolves.toBe(false);
  });

  it("normalizes an allowed WhatsApp sender without changing its identity", () => {
    expect(normalizeChannelSender(" +91 (98765) 43210 ")).toBe("+919876543210");
    expect(normalizeChannelSender("whatsapp:+1-415-555-0123")).toBe(
      "+14155550123"
    );
    expect(normalizeChannelSender("not-a-phone")).toBeNull();
  });
});
