import { JobPayload } from "@delulu/core";
import { Context, Schema } from "effect";

export const DurableJob = Schema.Struct({
  id: Schema.String,
  workspaceId: Schema.String,
  payload: JobPayload,
  runAt: Schema.Number.check(Schema.isGreaterThanOrEqualTo(0)),
  maxAttempts: Schema.Number.check(Schema.isGreaterThan(0)),
});
export type DurableJob = typeof DurableJob.Type;

export const JobIntent = Schema.Struct({
  receiptId: Schema.String,
  transactionId: Schema.String,
  key: Schema.String,
  job: Schema.NullOr(DurableJob),
});
export type JobIntent = typeof JobIntent.Type;

/** Acknowledges only after the intent and its alarm are durably stored. */
export class JobTransport extends Context.Service<
  JobTransport,
  {
    readonly prepare: (
      intent: JobIntent,
      signal?: AbortSignal
    ) => Promise<void>;
  }
>()("@delulu/services/JobTransport") {}
