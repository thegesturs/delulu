import {
  decodeWhatsAppWebhook,
  verifyWhatsAppChallenge,
  verifyWhatsAppSignature,
} from "@delulu/communication-whatsapp";
import { Effect } from "effect";
import { conversationName } from "./channel-routing";
import type { Env } from "./env";

export type { Env } from "./env";

const WEBHOOK_PATH = "/v1/providers/whatsapp/webhook";

async function readWebhookBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) {
    return "";
  }
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      size += chunk.value.byteLength;
      if (size > 256_000) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

const textResponse = (body: string, status: number) =>
  new Response(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });

const handleChallenge = async (url: URL, env: Env): Promise<Response> => {
  if (!env.WHATSAPP_VERIFY_TOKEN) {
    return textResponse("Webhook verification is not configured", 503);
  }
  const result = await Effect.runPromise(
    verifyWhatsAppChallenge(env.WHATSAPP_VERIFY_TOKEN, {
      mode: url.searchParams.get("hub.mode"),
      token: url.searchParams.get("hub.verify_token"),
      challenge: url.searchParams.get("hub.challenge"),
    }).pipe(
      Effect.match({
        onFailure: () => ({ ok: false as const }),
        onSuccess: (challenge) => ({ ok: true as const, challenge }),
      })
    )
  );
  return result.ok
    ? textResponse(result.challenge, 200)
    : textResponse("Forbidden", 403);
};

export const handleProviderIngress = async (
  request: Request,
  env: Env
): Promise<Response | null> => {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/live") {
    return jsonResponse({ service: "delulu-api", status: "ok" });
  }
  if (url.pathname !== WEBHOOK_PATH) {
    return null;
  }
  if (request.method === "GET") {
    return handleChallenge(url, env);
  }
  if (request.method === "POST") {
    if (
      env.WHATSAPP_INGRESS_ENABLED === "true" &&
      env.WHATSAPP_CONVERSATIONS &&
      env.WHATSAPP_PHONE_NUMBER_ID &&
      env.WHATSAPP_APP_SECRET &&
      env.WHATSAPP_TEST_SENDER &&
      env.WHATSAPP_TEST_EMAIL
    ) {
      const raw = await readWebhookBody(request);
      if (raw === null) {
        return textResponse("Payload too large", 413);
      }
      const verified = await Effect.runPromise(
        verifyWhatsAppSignature(
          env.WHATSAPP_APP_SECRET,
          raw,
          request.headers.get("x-hub-signature-256")
        ).pipe(Effect.match({ onSuccess: () => true, onFailure: () => false }))
      );
      if (!verified) {
        return textResponse("Forbidden", 403);
      }
      const messages = await Effect.runPromise(
        decodeWhatsAppWebhook(env.WHATSAPP_PHONE_NUMBER_ID, raw).pipe(
          Effect.match({ onSuccess: (value) => value, onFailure: () => null })
        )
      );
      if (!messages) {
        return textResponse("Invalid webhook", 400);
      }
      try {
        for (const message of messages) {
          if (message.sender.id !== env.WHATSAPP_TEST_SENDER) {
            continue;
          }
          await env.WHATSAPP_CONVERSATIONS.getByName(
            conversationName(env.WHATSAPP_PHONE_NUMBER_ID, message.sender.id)
          ).enqueue({
            id: message.messageKey,
            sender: message.sender.id,
            text:
              message.text?.trim() ||
              "The user sent an attachment. Explain that this staging test currently supports text only and ask them to type their message.",
          });
        }
        return jsonResponse({ accepted: true });
      } catch {
        return textResponse("Channel temporarily unavailable", 503);
      }
    }
    return new Response(
      JSON.stringify({ error: "Agent ingress is not connected" }),
      {
        status: 503,
        headers: {
          "cache-control": "no-store",
          "content-type": "application/json; charset=utf-8",
          "retry-after": "300",
          "x-content-type-options": "nosniff",
        },
      }
    );
  }
  return textResponse("Method not allowed", 405);
};
