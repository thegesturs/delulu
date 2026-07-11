import {
  SignedIngress,
  type StandardHeaders,
  WebhookIngressService,
} from "@delulu/services";
import { Effect, Predicate } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/unstable/http";

const header = (
  request: { readonly headers: unknown },
  name: string
): string | null => {
  if (!Predicate.isObject(request.headers)) {
    return null;
  }
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];
  return Predicate.isString(value) ? value : null;
};

const standardHeaders = (
  request: { readonly headers: unknown },
  prefix: "svix" | "webhook"
): StandardHeaders | null => {
  const id = header(request, `${prefix}-id`);
  const timestamp = header(request, `${prefix}-timestamp`);
  const signature = header(request, `${prefix}-signature`);
  return id && timestamp && signature ? { id, timestamp, signature } : null;
};

const responseFor = <A>(effect: Effect.Effect<A, unknown>) =>
  effect.pipe(
    Effect.map((processed) =>
      HttpServerResponse.jsonUnsafe({
        accepted: true,
        duplicate: processed === false,
      })
    ),
    Effect.catch((error) => {
      const retryable =
        Predicate.isObject(error) && Predicate.isBoolean(error.retryable)
          ? error.retryable
          : true;
      const message =
        Predicate.isObject(error) && Predicate.isString(error.message)
          ? error.message
          : "Webhook request failed";
      return Effect.succeed(
        HttpServerResponse.jsonUnsafe(
          { error: { code: "WebhookIngressError", message } },
          { status: retryable ? 503 : 400 }
        )
      );
    })
  );

export const WebhookRoutes = HttpRouter.use(
  Effect.fnUntraced(function* (router) {
    const signed = yield* SignedIngress;
    const ingress = yield* WebhookIngressService;

    yield* router.add(
      "GET",
      "/webhooks/meta",
      Effect.fn("WebhookRoutes.verifyMeta")(function* (request) {
        const url = new URL(request.url, "http://localhost");
        return yield* signed
          .verifyMetaChallenge({
            mode: url.searchParams.get("hub.mode"),
            token: url.searchParams.get("hub.verify_token"),
            challenge: url.searchParams.get("hub.challenge"),
          })
          .pipe(
            Effect.map((challenge) => HttpServerResponse.text(challenge)),
            Effect.catch(() =>
              Effect.succeed(
                HttpServerResponse.text("Forbidden", { status: 403 })
              )
            )
          );
      })
    );
    yield* router.add(
      "POST",
      "/webhooks/meta",
      Effect.fn("WebhookRoutes.receiveMeta")(function* (request) {
        return yield* request.text.pipe(
          Effect.flatMap((rawBody) =>
            signed
              .verifyMeta({
                rawBody,
                signature: header(request, "x-hub-signature-256"),
              })
              .pipe(
                Effect.flatMap(() =>
                  ingress.processMeta(
                    header(request, "x-hub-signature-256") ?? "",
                    rawBody
                  )
                )
              )
          ),
          responseFor
        );
      })
    );
    yield* router.add(
      "POST",
      "/webhooks/clerk",
      Effect.fn("WebhookRoutes.receiveClerk")(function* (request) {
        return yield* request.text.pipe(
          Effect.flatMap((rawBody) => {
            const headers = standardHeaders(request, "svix");
            if (!headers) {
              return Effect.fail({
                retryable: false,
                message: "Missing Clerk signature headers",
              });
            }
            return signed
              .verifyClerk(rawBody, headers)
              .pipe(
                Effect.flatMap(() => ingress.processClerk(headers.id, rawBody))
              );
          }),
          responseFor
        );
      })
    );
    yield* router.add(
      "POST",
      "/webhooks/dodo",
      Effect.fn("WebhookRoutes.receiveDodo")(function* (request) {
        return yield* request.text.pipe(
          Effect.flatMap((rawBody) => {
            const headers = standardHeaders(request, "webhook");
            if (!headers) {
              return Effect.fail({
                retryable: false,
                message: "Missing payment signature headers",
              });
            }
            return signed
              .verifyDodo(rawBody, headers)
              .pipe(
                Effect.flatMap(() => ingress.processDodo(headers.id, rawBody))
              );
          }),
          responseFor
        );
      })
    );
  })
);
