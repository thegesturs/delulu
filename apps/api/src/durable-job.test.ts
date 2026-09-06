import type { JobIntent } from "@delulu/services";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DurableJobObject,
  type JobRuntime,
  type JobState,
} from "./durable-job";

const intent = (id = crypto.randomUUID(), job = true): JobIntent => ({
  receiptId: id,
  transactionId: "42",
  key: "message:one",
  job: job
    ? {
        id,
        workspaceId: "workspace",
        payload: { _tag: "DeliverMessage", messageId: "message" },
        runAt: Date.now(),
        maxAttempts: 2,
      }
    : null,
});
const harness = () => {
  const values = new Map<string, unknown>();
  let alarm: number | null = null;
  const state: JobState = {
    storage: {
      get: async <T>(key: string) =>
        structuredClone(values.get(key)) as T | undefined,
      put: async (key, value) => {
        values.set(key, structuredClone(value));
      },
      delete: async (key) => values.delete(key),
      setAlarm: async (time) => {
        alarm = time;
      },
      deleteAlarm: async () => {
        alarm = null;
      },
    },
    blockConcurrencyWhile: (run) => run(),
  };
  const removed = new Set<string>();
  const runtime: JobRuntime = {
    receipt: vi.fn(async (value) =>
      removed.has(value.receiptId)
        ? ("aborted" as const)
        : ("committed" as const)
    ),
    removeReceipt: vi.fn(async (id) => {
      removed.add(id);
    }),
    execute: vi.fn(async () => null),
    failed: vi.fn(async () => undefined),
  };
  let object = new DurableJobObject(state, runtime);
  return {
    runtime,
    values,
    alarm: () => alarm,
    restart: () => {
      object = new DurableJobObject(state, runtime);
    },
    send: (value: JobIntent) =>
      object.fetch(
        new Request("https://jobs/prepare", {
          method: "POST",
          body: JSON.stringify(value),
        })
      ),
    tick: async () => {
      vi.setSystemTime(Math.max(Date.now(), alarm ?? Date.now()));
      await object.alarm();
    },
  };
};
afterEach(() => vi.useRealTimers());
describe("durable execution", () => {
  it("pauses receipt resolution and execution while keeping an alarm", async () => {
    vi.useFakeTimers();
    const h = harness();
    Object.assign(h.runtime, { paused: true });
    await h.send(intent());
    await h.tick();
    expect(h.runtime.receipt).not.toHaveBeenCalled();
    expect(h.runtime.execute).not.toHaveBeenCalled();
    expect(h.alarm()).not.toBeNull();
    Object.assign(h.runtime, { paused: false });
    await h.tick();
    await h.tick();
    await h.tick();
    expect(h.runtime.execute).toHaveBeenCalledTimes(1);
  });
  it("retains dedupe during failed cleanup and rejects replay after cleanup", async () => {
    vi.useFakeTimers();
    const h = harness();
    const value = intent();
    await h.send(value);
    await h.tick();
    vi.mocked(h.runtime.removeReceipt).mockRejectedValueOnce(
      new Error("offline")
    );
    await expect(h.tick()).rejects.toThrow("offline");
    await h.send(value);
    expect(h.values.has(`receipt:${value.receiptId}`)).toBe(true);
    await h.tick();
    h.restart();
    await h.send(value);
    await h.tick();
    await h.tick();
    expect(h.runtime.execute).toHaveBeenCalledTimes(1);
    expect(h.values.has(`receipt:${value.receiptId}`)).toBe(false);
  });
  it("survives restart and a repeated prepare without executing twice", async () => {
    vi.useFakeTimers();
    const h = harness();
    const value = intent();
    await h.send(value);
    h.restart();
    await h.send(value);
    await h.tick();
    await h.tick();
    await h.tick();
    expect(h.runtime.execute).toHaveBeenCalledTimes(1);
    expect(
      [...h.values.keys()].filter((key) => key.startsWith("receipt:"))
    ).toEqual([]);
    h.restart();
    await h.send(value);
    await h.tick();
    expect(h.runtime.execute).toHaveBeenCalledTimes(1);
    expect(h.alarm()).toBeNull();
  });
  it("waits for commit and discards rolled-back transactions", async () => {
    vi.useFakeTimers();
    const h = harness();
    vi.mocked(h.runtime.receipt)
      .mockResolvedValueOnce("pending")
      .mockResolvedValueOnce("aborted");
    await h.send(intent());
    await h.tick();
    expect(h.runtime.execute).not.toHaveBeenCalled();
    await h.tick();
    expect(h.alarm()).toBeNull();
    expect(h.runtime.removeReceipt).not.toHaveBeenCalled();
  });
  it("cancels a pending job without an idle alarm", async () => {
    vi.useFakeTimers();
    const h = harness();
    await h.send(intent());
    await h.tick();
    await h.send(intent(crypto.randomUUID(), false));
    await h.tick();
    await h.tick();
    await h.tick();
    expect(h.runtime.execute).not.toHaveBeenCalled();
    expect(h.alarm()).toBeNull();
  });
  it("persists failure status with retries before stopping", async () => {
    vi.useFakeTimers();
    const h = harness();
    vi.mocked(h.runtime.execute).mockRejectedValue(new Error("provider down"));
    vi.mocked(h.runtime.failed).mockRejectedValueOnce(
      new Error("database down")
    );
    await h.send(intent());
    await h.tick();
    await h.tick();
    await h.tick();
    await h.tick();
    await expect(h.tick()).rejects.toThrow("database down");
    h.restart();
    await h.tick();
    expect(h.runtime.execute).toHaveBeenCalledTimes(2);
    expect(h.runtime.failed).toHaveBeenCalledTimes(2);
    expect(h.alarm()).toBeNull();
  });
  it("keeps a cancellation that arrives during execution", async () => {
    vi.useFakeTimers();
    const h = harness();
    vi.mocked(h.runtime.execute).mockImplementation(async () => {
      await h.send(intent(crypto.randomUUID(), false));
      return Date.now() + 5000;
    });
    await h.send(intent());
    await h.tick();
    await h.tick();
    await h.tick();
    await h.tick();
    await h.tick();
    expect(h.runtime.execute).toHaveBeenCalledTimes(1);
    expect(h.alarm()).toBeNull();
  });
});
