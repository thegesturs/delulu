import { runPublisher } from "./publisher";

if (!(process.env.DATABASE_URL && process.env.ENCRYPTION_SECRET)) {
  throw new Error("DATABASE_URL and ENCRYPTION_SECRET are required");
}

const controller = new AbortController();
process.once("SIGINT", () => controller.abort());
process.once("SIGTERM", () => controller.abort());

await runPublisher({
  signal: controller.signal,
  concurrency: Number(process.env.PUBLISH_CONCURRENCY ?? 5),
  pollIntervalMs: Number(process.env.PUBLISH_POLL_INTERVAL_MS ?? 1000),
});
