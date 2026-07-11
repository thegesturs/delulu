import { BillingWebhookEvent } from "@delulu/core/domain/billing";
import { Effect, Schema } from "effect";
import { BillingWebhookApplication } from "../../../packages/services/src/billing-webhooks";

/**
 * Verified webhook ingress seam. Signature verification remains transport
 * owned; this validates the normalized event before synchronous application.
 */
export const handleBillingWebhook = Effect.fn("handleBillingWebhook")(
  function* (input: unknown) {
    const event = yield* Schema.decodeUnknownEffect(BillingWebhookEvent)(input);
    const application = yield* BillingWebhookApplication;
    return yield* application.apply(event);
  }
);
