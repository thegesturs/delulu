import { type DurableJob, JobIntent } from "@delulu/services";
import { Schema } from "effect";

interface Storage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  setAlarm(time: number): Promise<void>;
  deleteAlarm(): Promise<void>;
}
export interface JobState {
  readonly storage: Storage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}
interface ActiveJob {
  job: DurableJob;
  attempts: number;
  status: "pending" | "failing" | "completed" | "failed";
  error?: string;
}
export interface JobRuntime {
  readonly paused?: boolean;
  receipt(intent: JobIntent): Promise<"committed" | "pending" | "aborted">;
  removeReceipt(id: string): Promise<void>;
  execute(job: DurableJob): Promise<number | null>;
  failed(job: DurableJob, error: string): Promise<void>;
}
interface Snapshot {
  intents: JobIntent[];
  cleanup: string[];
  active?: ActiveJob;
}
const decode = Schema.decodeUnknownSync(JobIntent);
const RETRY_MS = 30_000;

/** One object per idempotency key; no global scan or idle recovery timer. */
export class DurableJobObject {
  private readonly state: JobState;
  private readonly runtime: JobRuntime;
  constructor(state: JobState, runtime: JobRuntime) {
    this.state = state;
    this.runtime = runtime;
  }
  private read() {
    return this.state.storage
      .get<Snapshot>("state")
      .then((value) => value ?? { intents: [], cleanup: [] });
  }
  private async save(snapshot: Snapshot) {
    await this.state.storage.put("state", snapshot);
    const next =
      snapshot.intents.length || snapshot.cleanup.length
        ? Date.now() + 1000
        : snapshot.active?.status === "failing"
          ? Date.now() + 1000
          : snapshot.active?.status === "pending"
            ? snapshot.active.job.runAt
            : null;
    if (next === null) {
      await this.state.storage.deleteAlarm();
    } else {
      await this.state.storage.setAlarm(Math.max(Date.now() + 100, next));
    }
  }
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response(null, { status: 405 });
    }
    const intent = decode(await request.json());
    await this.state.blockConcurrencyWhile(async () => {
      const snapshot = await this.read();
      const key = await this.state.storage.get<string>("key");
      if (key && key !== intent.key) {
        throw new Error("Job key mismatch");
      }
      if (!key) {
        await this.state.storage.put("key", intent.key);
      }
      // Replayed transport acknowledgements must not enqueue the same intent twice.
      if (
        !(
          snapshot.intents.some(
            (item) => item.receiptId === intent.receiptId
          ) ||
          (await this.state.storage.get<boolean>(`receipt:${intent.receiptId}`))
        )
      ) {
        if (snapshot.intents.length >= 100) {
          throw new Error("Too many unsettled job mutations");
        }
        snapshot.intents.push(intent);
      }
      await this.save(snapshot);
    });
    return new Response(null, { status: 204 });
  }
  async alarm(): Promise<void> {
    // A persisted retry protects interruption during receipt validation or execution.
    await this.state.storage.setAlarm(Date.now() + RETRY_MS);
    if (this.runtime.paused) {
      return;
    }
    const first = (await this.read()).intents[0];
    if (first) {
      const outcome = await this.runtime.receipt(first);
      if (outcome === "pending") {
        return;
      }
      await this.state.blockConcurrencyWhile(async () => {
        const snapshot = await this.read();
        if (snapshot.intents[0]?.receiptId !== first.receiptId) {
          return;
        }
        if (outcome === "committed") {
          snapshot.active = first.job
            ? { job: first.job, attempts: 0, status: "pending" }
            : undefined;
          snapshot.cleanup.push(first.receiptId);
        }
        snapshot.intents.shift();
        if (outcome === "committed") {
          await this.state.storage.put(`receipt:${first.receiptId}`, true);
        }
        await this.save(snapshot);
      });
      return;
    }
    const cleanup = (await this.read()).cleanup[0];
    if (cleanup) {
      await this.runtime.removeReceipt(cleanup);
      await this.state.blockConcurrencyWhile(async () => {
        const snapshot = await this.read();
        snapshot.cleanup = snapshot.cleanup.filter((id) => id !== cleanup);
        // A later replay is rejected by the now-absent SQL witness.
        await this.state.storage.delete(`receipt:${cleanup}`);
        await this.save(snapshot);
      });
      return;
    }
    const active = await this.state.blockConcurrencyWhile(async () => {
      const snapshot = await this.read();
      const active = snapshot.active;
      if (
        !active ||
        (active.status !== "pending" && active.status !== "failing") ||
        (active.status === "pending" && active.job.runAt > Date.now())
      ) {
        await this.save(snapshot);
        return undefined;
      }
      if (active.attempts >= active.job.maxAttempts) {
        active.status = "failing";
        active.error = active.error ?? "Execution attempts exhausted";
        await this.save(snapshot);
        return active;
      }
      active.attempts++;
      active.job = { ...active.job, runAt: Date.now() + RETRY_MS };
      await this.state.storage.put("state", snapshot);
      return active;
    });
    if (!active) {
      return;
    }
    if (active.status === "failing") {
      await this.runtime.failed(
        active.job,
        active.error ?? "Execution attempts exhausted"
      );
      await this.state.blockConcurrencyWhile(async () => {
        const snapshot = await this.read();
        if (snapshot.active?.job.id === active.job.id) {
          snapshot.active.status = "failed";
        }
        await this.save(snapshot);
      });
      return;
    }
    let next: number | null = null;
    let failure: string | undefined;
    try {
      next = await this.runtime.execute(active.job);
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      next = Date.now() + Math.min(300_000, 1000 * 2 ** active.attempts);
    }
    await this.state.blockConcurrencyWhile(async () => {
      const snapshot = await this.read();
      if (snapshot.active?.job.id === active.job.id) {
        snapshot.active.error = failure;
        snapshot.active.status =
          next === null
            ? "completed"
            : failure && active.attempts >= active.job.maxAttempts
              ? "failing"
              : "pending";
        if (next !== null) {
          snapshot.active.job = { ...active.job, runAt: next };
        }
        if (!failure) {
          snapshot.active.attempts = 0;
        }
      }
      // A concurrent cancellation/reschedule is still in intents and gets its
      // own alarm; completing this attempt never overwrites that request.
      await this.save(snapshot);
    });
  }
}
