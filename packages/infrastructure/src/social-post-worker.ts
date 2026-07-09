import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load worker env vars from bundled .env.prod before any worker imports
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env.prod") });

import type { SQSEvent } from "aws-lambda";
import { processMessage } from "../../worker/client";

export async function handler(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    // messageId = correlation id; ApproximateReceiveCount = attempt number
    // (increments on each redelivery) so retries append new attempt rows.
    const receiveCount = Number(record.attributes?.ApproximateReceiveCount);
    await processMessage(
      record.body,
      record.messageId,
      Number.isFinite(receiveCount) ? receiveCount : undefined
    );
  }
}
