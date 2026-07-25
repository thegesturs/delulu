import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import packageMetadata from "../package.json";
import { CLI_VERSION } from "./version.js";

describe("CLI command registration", () => {
  it("reports the package version", () => {
    expect(CLI_VERSION).toBe(packageMetadata.version);
  });

  it("registers each accounts subcommand once", () => {
    const entrypoint = resolve(import.meta.dirname, "index.ts");
    const source = readFileSync(entrypoint, "utf8");
    const connectRegistrations = source.match(
      /\.command\("connect <platform>"\)/g
    );

    expect(connectRegistrations).toHaveLength(1);
  });
});
