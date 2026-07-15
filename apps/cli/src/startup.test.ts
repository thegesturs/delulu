import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CLI startup", () => {
  it("registers commands and renders help", () => {
    const entrypoint = resolve(import.meta.dirname, "index.ts");
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", entrypoint, "--help"],
      {
        encoding: "utf8",
        env: { ...process.env, DELULU_TELEMETRY_DISABLED: "1" },
      }
    );

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Usage: delulu [options] [command]");
    expect(result.stdout).toContain("accounts");
  });
});
