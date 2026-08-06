import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  completeOperation,
  findOperation,
  journalPath,
  prepareOperation,
} from "./operation-journal.js";

afterEach(() => vi.unstubAllEnvs());

describe("operation journal", () => {
  it("reuses an operation for 24 hours without storing content", async () => {
    const home = await mkdtemp(join(tmpdir(), "delulu-journal-"));
    vi.stubEnv("HOME", home);
    const first = await prepareOperation({
      command: "post",
      fingerprintValue: {
        caption: "private caption",
        workspace: "workspace_1",
      },
      now: 100,
    });
    await completeOperation(first.operationId, "post_1");
    const replay = await prepareOperation({
      command: "post",
      fingerprintValue: {
        caption: "private caption",
        workspace: "workspace_1",
      },
      now: 200,
    });

    expect(replay.replayed).toBe(true);
    expect(replay.idempotencyKey).toBe(first.idempotencyKey);
    expect(replay.resourceId).toBe("post_1");
    expect(await readFile(journalPath(), "utf8")).not.toContain(
      "private caption"
    );
  });

  it("creates a distinct operation with forceNew", async () => {
    const home = await mkdtemp(join(tmpdir(), "delulu-journal-new-"));
    vi.stubEnv("HOME", home);
    const first = await prepareOperation({
      command: "post",
      fingerprintValue: { value: 1 },
    });
    const second = await prepareOperation({
      command: "post",
      fingerprintValue: { value: 1 },
      forceNew: true,
    });
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
  });

  it("finds a completed replay without changing the journal", async () => {
    const home = await mkdtemp(join(tmpdir(), "delulu-journal-read-"));
    vi.stubEnv("HOME", home);
    const input = {
      command: "post",
      fingerprintValue: { value: "same" },
      now: 100,
    };
    const first = await prepareOperation(input);
    await completeOperation(first.operationId, "post_1");
    const before = await readFile(journalPath(), "utf8");

    const replay = await findOperation({ ...input, now: 200 });

    expect(replay).toMatchObject({ resourceId: "post_1", replayed: true });
    expect(await readFile(journalPath(), "utf8")).toBe(before);
  });

  it("serializes concurrent journal updates without losing operations", async () => {
    const home = await mkdtemp(join(tmpdir(), "delulu-journal-race-"));
    vi.stubEnv("HOME", home);
    const operations = await Promise.all(
      Array.from({ length: 10 }, (_, value) =>
        prepareOperation({
          command: "post",
          fingerprintValue: { value },
        })
      )
    );
    expect(new Set(operations.map((item) => item.operationId)).size).toBe(10);
    const journal = JSON.parse(
      await readFile(journalPath(), "utf8")
    ) as unknown[];
    expect(journal).toHaveLength(10);
  });
});
