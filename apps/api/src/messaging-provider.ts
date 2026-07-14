import { MessagingProvider } from "@delulu/services";
import { Effect, Layer } from "effect";
import type { Env } from "./env";

const loopsRequest = (token: string, path: string, body: unknown) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(`https://app.loops.so/api/v1${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Loops returned ${response.status}`);
      }
    },
    catch: (cause) => cause,
  });

/** Cloudflare owns transactional delivery; Loops receives only lifecycle data. */
export const messagingProviderLayer = (env: Env) => {
  if (!(env.EMAIL && env.CLOUDFLARE_EMAIL_FROM && env.LOOPS_API_KEY)) {
    return Layer.succeed(
      MessagingProvider,
      MessagingProvider.of({
        name: "noop",
        identify: () => Effect.void,
        track: () => Effect.void,
        sendTransactional: () => Effect.succeed({}),
      })
    );
  }
  return Layer.succeed(
    MessagingProvider,
    MessagingProvider.of({
      name: "cloudflare-loops",
      identify: (input) =>
        loopsRequest(env.LOOPS_API_KEY!, "/contacts/create", {
          email: input.email,
          userId: input.userId,
          ...input.attributes,
        }),
      track: (input) =>
        loopsRequest(env.LOOPS_API_KEY!, "/events/send", {
          email: input.email,
          eventName: input.event,
          eventProperties: input.properties,
        }),
      sendTransactional: (input) =>
        Effect.tryPromise({
          try: () =>
            env.EMAIL!.send({
              from: env.CLOUDFLARE_EMAIL_FROM!,
              to: input.to,
              subject: input.subject,
              html: input.html,
              text: input.text,
              headers: {
                "x-idempotency-key": input.idempotencyKey,
                ...(input.replyTo ? { "reply-to": input.replyTo } : {}),
              },
            }),
          catch: (cause) => cause,
        }).pipe(Effect.as({})),
    })
  );
};
