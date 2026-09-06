import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { setTimeout } from "node:timers/promises";

import { build } from "esbuild";
import { Miniflare } from "miniflare";

test("SQLite durable job recovery", async () => {
  const directory = await mkdtemp(join(tmpdir(), "durable-smoke-"));
  const scriptPath = join(directory, "worker.mjs");
  const modulePath = resolve(import.meta.dirname, "../src/durable-job.ts");
  await build({
    stdin: {
      contents: `
import { DurableJobObject } from ${JSON.stringify(modulePath)};
export class SmokeJob extends DurableJobObject {
  constructor(state) {
    super(state, { receipt: async () => "committed", removeReceipt: async () => undefined,
      execute: async () => { await state.storage.put("executions", (await state.storage.get("executions") ?? 0) + 1); return null; },
      failed: async () => { throw new Error("unexpected failure"); } });
    this.stateForSmoke = state;
  }
  async fetch(request) {
    if (request.method === "GET") return Response.json({ executions: await this.stateForSmoke.storage.get("executions") ?? 0, alarm: await this.stateForSmoke.storage.getAlarm() });
    return super.fetch(request);
  }
}
export default { fetch(request, env) { return env.JOBS.get(env.JOBS.idFromName("smoke")).fetch(request); } };
`,
      resolveDir: resolve(import.meta.dirname, ".."),
      loader: "ts",
    },
    outfile: scriptPath,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    external: ["node:*"],
  });
  let runtime;
  try {
    const options = {
      modules: true,
      modulesRoot: directory,
      scriptPath,
      compatibilityDate: "2026-07-15",
      compatibilityFlags: ["nodejs_compat"],
      durableObjects: { JOBS: { className: "SmokeJob", useSQLite: true } },
      durableObjectsPersist: join(directory, "state"),
    };
    runtime = new Miniflare(options);
    const id = crypto.randomUUID();
    const intent = {
      receiptId: id,
      transactionId: "42",
      key: "smoke",
      job: {
        id,
        workspaceId: "test",
        payload: { _tag: "DeliverMessage", messageId: "test" },
        runAt: Date.now(),
        maxAttempts: 3,
      },
    };
    const prepare = () =>
      runtime.dispatchFetch("https://jobs/prepare", {
        method: "POST",
        body: JSON.stringify(intent),
      });
    assert.equal((await prepare()).status, 204);
    await runtime.dispose();
    runtime = new Miniflare(options);
    assert.equal((await prepare()).status, 204);
    let state;
    for (let attempt = 0; attempt < 20; attempt++) {
      state = await (await runtime.dispatchFetch("https://jobs/state")).json();
      if (state.executions === 1 && state.alarm === null) {
        break;
      }
      await setTimeout(500);
    }
    assert.deepEqual(state, { executions: 1, alarm: null });
    console.log(
      "SQLite DO: restart, duplicate prepare, real alarm execution and idle shutdown passed"
    );
  } finally {
    await runtime?.dispose();
    await rm(directory, { recursive: true, force: true });
  }
});
