import { getEventListeners } from "node:events";
import { describe, expect, it } from "vitest";
import { waitForPoll } from "./publisher";

describe("publisher polling", () => {
  it("removes the abort listener after the timer completes", async () => {
    const controller = new AbortController();
    await waitForPoll(controller.signal, 1);
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(0);
  });

  it("stops waiting when shutdown is requested", async () => {
    const controller = new AbortController();
    const waiting = waitForPoll(controller.signal, 60_000);
    controller.abort();
    await expect(waiting).resolves.toBeUndefined();
    expect(getEventListeners(controller.signal, "abort")).toHaveLength(0);
  });
});
