import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Publish Pipeline v2 — recover jobs stuck in PROCESSING (worker crash, lost
// SQS message, Lambda timeout). Re-queues or dead-letters, then re-derives post
// status so the dashboard heals without user action.
crons.interval(
  "sweep stuck publish jobs",
  { minutes: 15 },
  internal.publish.sweepStuckJobs,
  {}
);

export default crons;
