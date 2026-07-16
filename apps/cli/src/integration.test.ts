import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  installIntegration,
  integrationStatus,
  removeIntegration,
} from "./integration.js";

afterEach(() => vi.unstubAllEnvs());

describe("agent awareness integration", () => {
  it("installs and removes a credentials-free skill", async () => {
    vi.stubEnv("HOME", await mkdtemp(join(tmpdir(), "delulu-agent-skill-")));
    const installed = await installIntegration();
    expect(installed).toMatchObject({
      installed: true,
      credentialsIncluded: false,
    });
    const body = await readFile(join(installed.path, "SKILL.md"), "utf8");
    expect(body).not.toContain("accessToken");
    expect(body).not.toContain("refreshToken");
    await expect(removeIntegration()).resolves.toMatchObject({ removed: true });
    await expect(integrationStatus()).resolves.toMatchObject({
      installed: false,
    });
  });
});
