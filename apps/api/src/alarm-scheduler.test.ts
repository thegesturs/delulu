import { describe, expect, it, vi } from "vitest";
import {
  AlarmScheduler,
  type AlarmState,
  type SchedulerLane,
} from "./alarm-scheduler";

const setup = (
  run: (lane: SchedulerLane) => Promise<number | null> = async () => null
) => {
  let alarm: number | null = null;
  let now = 1000;
  const values = new Map<string, unknown>();
  const state: AlarmState = {
    storage: {
      get: async <T>(key: string) => values.get(key) as T | undefined,
      put: async (key, value) => {
        values.set(key, value);
      },
      getAlarm: async () => alarm,
      setAlarm: async (time) => {
        alarm = time;
      },
    },
    blockConcurrencyWhile: async (callback) => callback(),
  };
  const scheduler = new AlarmScheduler(state, run, () => now);
  const notify = (lane = "dispatch", wake = false) =>
    scheduler.fetch(
      new Request(`https://scheduler/${lane}${wake ? "?wake" : ""}`, {
        method: "POST",
      })
    );
  const fire = async () => {
    alarm = null;
    await scheduler.alarm();
  };
  return {
    scheduler,
    state,
    notify,
    fire,
    alarm: () => alarm,
    setNow: (value: number) => {
      now = value;
    },
  };
};

describe("Durable Object scheduling", () => {
  it("bootstraps once and survives reconstruction without postponing work", async () => {
    const test = setup();
    await test.notify();
    test.setNow(5000);
    const restarted = new AlarmScheduler(
      test.state,
      async () => null,
      () => 5000
    );
    await restarted.fetch(
      new Request("https://scheduler/dispatch", { method: "POST" })
    );
    expect(test.alarm()).toBe(1000);
  });

  it("arms recovery before dispatch, including failures beyond automatic retry limits", async () => {
    const test = setup(async () => {
      expect(test.alarm()).toBe(61_000);
      throw new Error("Database unavailable");
    });
    await test.notify();
    for (let attempt = 0; attempt < 8; attempt++) {
      await expect(test.fire()).rejects.toThrow("Database unavailable");
      expect(test.alarm()).toBe(61_000);
    }
  });

  it("schedules the next job deadline without waiting for the recovery interval", async () => {
    const test = setup(async () => 7500);
    await test.notify();
    await test.fire();
    expect(test.alarm()).toBe(7500);
  });

  it("drains an overdue batch promptly without a tight alarm loop", async () => {
    const test = setup(async () => 500);
    await test.notify();
    await test.fire();
    expect(test.alarm()).toBe(1100);
  });

  it("preserves an earlier wakeup arriving while a dispatch is awaiting I/O", async () => {
    let finish!: (value: number) => void;
    const test = setup(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    await test.notify();
    const running = test.fire();
    await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
    await test.notify("dispatch", true);
    finish(30_000);
    await running;
    expect(test.alarm()).toBe(1000);
  });

  it("keeps a recovery wakeup when no jobs remain or notifications are lost", async () => {
    const test = setup();
    await test.notify();
    await test.fire();
    expect(test.alarm()).toBe(61_000);
  });

  it("runs maintenance and campaign objects independently", async () => {
    const run = vi.fn(async () => null);
    const test = setup(run);
    await test.notify("maintenance");
    await test.fire();
    expect(run).toHaveBeenCalledWith("maintenance");
    await expect(test.notify("recovery")).rejects.toThrow("lane cannot change");
  });
});
