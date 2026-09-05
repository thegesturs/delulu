import { verifyWhatsAppChallenge } from "@delulu/communication-whatsapp";
import { Effect } from "effect";

const WEBHOOK_PATH = "/v1/providers/whatsapp/webhook";

export interface Env {
  readonly WHATSAPP_VERIFY_TOKEN?: string;
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
