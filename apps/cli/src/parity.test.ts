import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(resolve(import.meta.dirname, path), "utf8");

describe("shared client consumer parity", () => {
  it("keeps CLI resource commands on the contract client", () => {
    const commandSource = source("./index.ts");
    const runtimeSource = source("./runtime.ts");
    expect(runtimeSource).toContain("getContractClient");
    expect(commandSource).not.toContain("apiRequest(");
  });

  it("keeps MCP API resources on the contract client", () => {
    const mcpSource = source("../../mcp/src/api-client.ts");
    expect(mcpSource).toContain("createApiClient");
    expect(mcpSource).not.toContain("fetch(");
    expect(mcpSource).not.toContain("private async request");
  });
});
