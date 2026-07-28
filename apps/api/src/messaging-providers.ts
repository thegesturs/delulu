import {
  LifecycleProvider,
  TransactionalEmailProvider,
} from "@delulu/services";
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

const lifecycleProviderLayer = (env: Env) =>
  Layer.succeed(
    LifecycleProvider,
    LifecycleProvider.of({
      name: "loops",
      identify: (input) =>
        env.LOOPS_API_KEY
          ? loopsRequest(env.LOOPS_API_KEY, "/contacts/create", {
              email: input.email,
              userId: input.userId,
              ...input.attributes,
            })
          : Effect.fail(new Error("Lifecycle provider is not configured")),
      track: (input) =>
        env.LOOPS_API_KEY
          ? loopsRequest(env.LOOPS_API_KEY, "/events/send", {
              email: input.email,
              eventName: input.event,
              eventProperties: input.properties,
            })
          : Effect.fail(new Error("Lifecycle provider is not configured")),
    })
  );

const transactionalEmailProviderLayer = (env: Env) =>
  Layer.succeed(
    TransactionalEmailProvider,
    TransactionalEmailProvider.of({
      name: "cloudflare-email",
      send: (input) =>
        env.EMAIL && env.CLOUDFLARE_EMAIL_FROM
          ? Effect.tryPromise({
              try: () =>
                env.EMAIL!.send({
                  from: {
                    email: env.CLOUDFLARE_EMAIL_FROM!,
                    name: "Delulu Social",
                  },
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
            })
          : Effect.fail(new Error("Transactional email is not configured")),
    })
  );

export const messagingProvidersLayer = (env: Env) =>
  Layer.mergeAll(
    lifecycleProviderLayer(env),
    transactionalEmailProviderLayer(env)
  );
