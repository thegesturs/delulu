import { Effect } from "effect";
import { fetchEffect } from "../../services/http";
import type { PlatformWebhooks } from "../../types";
import { PROVIDER, WEBHOOK_VERSION } from "./constants";

/**
 * Subscribe the connected Instagram Business account to the webhook fields
 * that drive comment triggers, inbound messages, quick replies, and template
 * postback buttons. Best effort: a failure is logged, not fatal, so a connect
 * never fails purely because subscription was slow.
 */
export const instagramWebhooks: PlatformWebhooks = {
  subscribe: ({ profileId, accessToken }) =>
    Effect.gen(function* () {
      const url = `https://graph.instagram.com/${WEBHOOK_VERSION}/${profileId}/subscribed_apps?subscribed_fields=comments,messages,messaging_postbacks&access_token=${accessToken}`;

      const response = yield* fetchEffect(PROVIDER, url, {
        method: "POST",
      }).pipe(Effect.option);

      if (response._tag === "None" || !response.value.ok) {
        yield* Effect.logWarning(
          `[instagram] webhook subscribe did not succeed for ${profileId}`
        );
      }
    }),
};
