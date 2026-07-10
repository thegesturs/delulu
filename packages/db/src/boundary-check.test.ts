import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { findBoundaryViolations } from "../../../scripts/check-connections-boundary";

describe("connections export boundary", () => {
  it("accepts the production Workers-safe entry graph", () => {
    expect(
      findBoundaryViolations(
        resolve(import.meta.dirname, "../../connections/src/index.ts")
      )
    ).toEqual([]);
  });

  it("detects a forbidden transitive dependency", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "connections-boundary-"));
    writeFileSync(resolve(directory, "index.ts"), 'export * from "./unsafe";');
    writeFileSync(
      resolve(directory, "unsafe.ts"),
      'import("axios"); require("@delulu/connections/worker");'
    );
    expect(
      findBoundaryViolations(resolve(directory, "index.ts")).length
    ).toBeGreaterThan(1);
  });

  it("allows a safe package alias", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "connections-boundary-"));
    writeFileSync(
      resolve(directory, "index.ts"),
      'import "@delulu/connections";'
    );
    expect(findBoundaryViolations(resolve(directory, "index.ts"))).toEqual([]);
  });
});
