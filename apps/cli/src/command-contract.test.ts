import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { decode } from "@toon-format/toon";
import { describe, expect, it } from "vitest";

const entrypoint = resolve(import.meta.dirname, "index.ts");
const tsx = resolve(import.meta.dirname, "../node_modules/tsx/dist/cli.mjs");
const commands = [
  "login",
  "logout",
  "workspace",
  "accounts",
  "connect",
  "disconnect",
  "subscribe",
  "usage",
  "post",
  "posts",
  "show",
  "edit",
  "publish",
  "retry",
  "delete",
  "upload",
  "reviews",
  "review",
  "integrate",
] as const;

const invokeHelp = (mode: "--toon" | "--json" | "--pretty", command: string) =>
  spawnSync(process.execPath, [tsx, entrypoint, mode, "help", command], {
    encoding: "utf8",
    env: {
      ...process.env,
      DELULU_TELEMETRY_DISABLED: "1",
      NO_COLOR: "1",
    },
  });

describe("public command output contract", () => {
  it("emits decodable TOON help for every journey command", () => {
    for (const command of commands) {
      const result = invokeHelp("--toon", command);
      expect(result.status, result.stderr).toBe(0);
      expect(decode(result.stdout)).toMatchObject({
        schema: "delulu.cli/v1",
        status: "ok",
        data: {
          resultFields: ["status", "message", "summary", "data", "next"],
        },
      });
    }
  }, 30_000);

  it("keeps JSON and pretty help aligned", () => {
    const json = invokeHelp("--json", "post");
    const pretty = invokeHelp("--pretty", "post");
    expect(json.status, json.stderr).toBe(0);
    expect(JSON.parse(json.stdout)).toMatchObject({
      schema: "delulu.cli/v1",
      status: "ok",
      message: "Help for post",
    });
    expect(pretty.status, pretty.stderr).toBe(0);
    expect(pretty.stdout).toContain("status: ok");
    expect(pretty.stdout).not.toContain("\u001b[");
  });
});
