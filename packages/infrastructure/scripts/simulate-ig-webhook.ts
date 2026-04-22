#!/usr/bin/env tsx
/**
 * Instagram webhook simulator.
 *
 * Signs a fake IG webhook payload with HMAC-SHA256 and POSTs it to the live
 * Lambda URL (or any endpoint you pass with --url). Lets you exercise the
 * full pipeline — signature validation, KV gate, Convex query, automation
 * execution — without needing a real IG account to drop a comment.
 *
 * Usage:
 *   tsx scripts/simulate-ig-webhook.ts comment \
 *     --url https://xxx.lambda-url.us-east-1.on.aws/ \
 *     --secret $INSTAGRAM_APP_SECRET \
 *     --profile-id 17841400000000000 \
 *     --media-id 17890000000000000 \
 *     --text "hello from the simulator" \
 *     --sender-id 100000000000000 \
 *     --username test_user
 *
 *   tsx scripts/simulate-ig-webhook.ts message \
 *     --url ... --secret ... --profile-id ... --sender-id ... \
 *     --text "email@example.com"
 *
 *   tsx scripts/simulate-ig-webhook.ts quick-reply \
 *     --url ... --secret ... --profile-id ... --sender-id ... \
 *     --payload "auto1:step2:btn_foo"
 *
 * Flags can also come from env: INSTAGRAM_APP_SECRET, IG_WEBHOOK_URL.
 *
 * Exit code is 0 on HTTP 2xx, 1 otherwise — CI-friendly.
 */

import { createHmac } from "node:crypto";
import process from "node:process";

// biome-ignore lint/suspicious/noExplicitAny: tiny script, happy to be loose
type Json = any;

function parseArgs(argv: string[]): {
  mode: "comment" | "message" | "quick-reply";
  flags: Record<string, string>;
} {
  const [mode, ...rest] = argv.slice(2);
  if (!(mode === "comment" || mode === "message" || mode === "quick-reply")) {
    throw new Error(
      `First positional arg must be 'comment', 'message', or 'quick-reply'. Got: ${mode}`
    );
  }
  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    const value = rest[i + 1];
    if (!(key?.startsWith("--") && value !== undefined)) {
      throw new Error(`Malformed flag near "${key}"`);
    }
    flags[key.slice(2)] = value;
  }
  return { mode, flags };
}

function requireFlag(flag: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required --${flag}`);
  }
  return value;
}

function buildCommentPayload(flags: Record<string, string>): Json {
  const profileId = requireFlag("profile-id", flags["profile-id"]);
  const mediaId = requireFlag("media-id", flags["media-id"]);
  const text = flags.text ?? "simulated comment";
  const senderId = requireFlag("sender-id", flags["sender-id"]);
  const username = flags.username ?? "simulator";
  const commentId = flags["comment-id"] ?? `sim_${Date.now()}`;

  return {
    object: "instagram",
    entry: [
      {
        id: profileId,
        time: Date.now(),
        changes: [
          {
            field: "comments",
            value: {
              from: { id: senderId, username },
              media: { id: mediaId },
              id: commentId,
              text,
            },
          },
        ],
      },
    ],
  };
}

function buildMessagePayload(flags: Record<string, string>): Json {
  const profileId = requireFlag("profile-id", flags["profile-id"]);
  const senderId = requireFlag("sender-id", flags["sender-id"]);
  const text = flags.text ?? "hello from simulator";
  const messageId = flags["message-id"] ?? `sim_msg_${Date.now()}`;

  return {
    object: "instagram",
    entry: [
      {
        id: profileId,
        time: Date.now(),
        messaging: [
          {
            sender: { id: senderId },
            recipient: { id: profileId },
            timestamp: Date.now(),
            message: { mid: messageId, text },
          },
        ],
      },
    ],
  };
}

function buildQuickReplyPayload(flags: Record<string, string>): Json {
  const profileId = requireFlag("profile-id", flags["profile-id"]);
  const senderId = requireFlag("sender-id", flags["sender-id"]);
  const payload = requireFlag("payload", flags.payload);
  const messageId = flags["message-id"] ?? `sim_qr_${Date.now()}`;

  return {
    object: "instagram",
    entry: [
      {
        id: profileId,
        time: Date.now(),
        messaging: [
          {
            sender: { id: senderId },
            recipient: { id: profileId },
            timestamp: Date.now(),
            message: {
              mid: messageId,
              quick_reply: { payload },
            },
          },
        ],
      },
    ],
  };
}

function signBody(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

async function main(): Promise<void> {
  const { mode, flags } = parseArgs(process.argv);

  const url =
    flags.url ?? process.env.IG_WEBHOOK_URL ?? requireFlag("url", undefined);
  const secret =
    flags.secret ??
    process.env.INSTAGRAM_APP_SECRET ??
    requireFlag("secret", undefined);

  let payload: Json;
  switch (mode) {
    case "comment":
      payload = buildCommentPayload(flags);
      break;
    case "message":
      payload = buildMessagePayload(flags);
      break;
    case "quick-reply":
      payload = buildQuickReplyPayload(flags);
      break;
    default:
      throw new Error(`Unreachable mode: ${mode}`);
  }

  const body = JSON.stringify(payload);
  const signature = signBody(body, secret);

  console.log("→ POST", url);
  console.log("  mode    :", mode);
  console.log("  payload :", JSON.stringify(payload, null, 2));
  console.log("  sig     :", signature);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": signature,
    },
    body,
  });

  const responseBody = await res.text();
  console.log("←", res.status, responseBody);

  if (!res.ok) {
    process.exit(1);
  }

  console.log(
    "\nNext: check your Convex logs for [process] / [skip] / [match] lines."
  );
  console.log(
    "If automation fired, you should see a DM in the recipient's inbox and"
  );
  console.log("a new row in the `automationLogs` table with status DM_SENT.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
