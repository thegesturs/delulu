import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env.prod") });

import type { SQSEvent } from "aws-lambda";
import { PostHog } from "posthog-node";
import {
  processPostgresMessage,
  type WorkerTelemetry,
} from "../../worker/postgres-client";

/**
 * PostHog client for the publish worker. Plain Node/Lambda, so `posthog-node`
 * (with its own flush lifecycle) is the correct fit. `flushAt: 1` sends eagerly;
 * we still `shutdown()` after each batch to guarantee delivery before the Lambda
 * freezes. Absent `POSTHOG_KEY` ⇒ no client and a no-op telemetry sink.
 */
const posthog = process.env.POSTHOG_KEY
  ? new PostHog(process.env.POSTHOG_KEY, {
      host: process.env.POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  : null;

const telemetry: WorkerTelemetry | undefined = posthog
  ? {
      capture: (input) =>
        posthog.capture({
          distinctId: input.distinctId,
          event: input.event,
          properties: {
            ...input.properties,
            ...(input.groups ? { $groups: input.groups } : {}),
            environment: process.env.ENVIRONMENT ?? "production",
          },
        }),
    }
  : undefined;

export async function handler(event: SQSEvent): Promise<void> {
  try {
    for (const record of event.Records) {
      await processPostgresMessage(record.body, undefined, telemetry);
    }
  } finally {
    // Flush buffered analytics before the Lambda execution environment freezes.
    if (posthog) {
      await posthog.flush().catch(() => {
        // Telemetry delivery must never fail message processing.
      });
    }
  }
}
