import { MetaWebhookPayload } from "@delulu/contracts";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  metaCommentAutomationEvent,
  metaMessagingAutomationEvent,
} from "./webhook-ingress";

const change = (overrides: Record<string, unknown> = {}) => {
  const payload = Schema.decodeUnknownSync(MetaWebhookPayload)({
    object: "instagram",
    entry: [
      {
        id: "business_1",
        changes: [
          {
            field: "comments",
            value: {
              id: "comment_1",
              text: "guide",
              from: { id: "commenter_1", username: "reader" },
              media: { id: "media_1" },
              ...overrides,
            },
          },
        ],
      },
    ],
  });
  return payload.entry[0].changes?.[0];
};

describe("Meta comment automation events", () => {
  it("accepts a top-level comment from another account", () => {
    const decoded = change();
    expect(decoded).toBeDefined();
    if (decoded) {
      expect(metaCommentAutomationEvent("business_1", decoded)).toMatchObject({
        eventId: "comment_1",
        platformUserId: "commenter_1",
        mediaId: "media_1",
      });
    }
  });

  it("ignores replies to comments", () => {
    const decoded = change({ parent_id: "comment_0" });
    expect(decoded).toBeDefined();
    if (decoded) {
      expect(metaCommentAutomationEvent("business_1", decoded)).toBeNull();
    }
  });

  it("ignores comments authored by the connected account", () => {
    const decoded = change({
      from: { id: "business_1", username: "brand" },
    });
    expect(decoded).toBeDefined();
    if (decoded) {
      expect(metaCommentAutomationEvent("business_1", decoded)).toBeNull();
    }
  });
});

describe("Meta messaging automation events", () => {
  it("retains template-button postback payloads after webhook decoding", () => {
    const payload = Schema.decodeUnknownSync(MetaWebhookPayload)({
      object: "instagram",
      entry: [
        {
          id: "business_1",
          messaging: [
            {
              sender: { id: "commenter_1" },
              recipient: { id: "business_1" },
              postback: {
                mid: "message_1",
                title: "Send guide",
                payload: "send-guide",
              },
            },
          ],
        },
      ],
    });
    const message = payload.entry[0].messaging?.[0];
    expect(message).toBeDefined();
    if (message) {
      expect(
        metaMessagingAutomationEvent("business_1", message, "fallback_1")
      ).toMatchObject({
        _tag: "MessageReceived",
        eventId: "message_1",
        platformUserId: "commenter_1",
        text: "Send guide",
        quickReplyPayload: "send-guide",
      });
    }
  });

  it("ignores outbound message echoes from the connected account", () => {
    const payload = Schema.decodeUnknownSync(MetaWebhookPayload)({
      object: "instagram",
      entry: [
        {
          id: "business_1",
          messaging: [
            {
              sender: { id: "business_1" },
              recipient: { id: "commenter_1" },
              message: {
                mid: "message_echo_1",
                text: "Here is your guide",
              },
            },
          ],
        },
      ],
    });
    const message = payload.entry[0].messaging?.[0];
    expect(message).toBeDefined();
    if (message) {
      expect(
        metaMessagingAutomationEvent("business_1", message, "fallback_1")
      ).toBeNull();
    }
  });
});
