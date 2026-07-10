import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env.prod") });

import type { SQSEvent } from "aws-lambda";
import { processPostgresMessage } from "../../worker/postgres-client";

export async function handler(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    await processPostgresMessage(record.body);
  }
}
