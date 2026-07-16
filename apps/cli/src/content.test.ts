import { createReadStream, openSync } from "node:fs";
import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { resolveContent } from "./content.js";

describe("post content input", () => {
  it("reads piped stdin", async () => {
    const stdin = Readable.from(["  generated caption\n"]);
    Object.defineProperty(stdin, "isTTY", { value: false });
    await expect(resolveContent({ stdin, required: true })).resolves.toBe(
      "generated caption"
    );
  });

  it("rejects ambiguous sources", async () => {
    const stdin = Readable.from(["stdin"]);
    Object.defineProperty(stdin, "isTTY", { value: false });
    await expect(
      resolveContent({ argument: "argument", stdin })
    ).rejects.toMatchObject({
      code: "AMBIGUOUS_CONTENT",
      exitCode: 2,
    });
  });

  it("does not mistake inherited /dev/null for piped content", async () => {
    const stdin = createReadStream("/dev/null", {
      fd: openSync("/dev/null", "r"),
    });
    Object.defineProperty(stdin, "isTTY", { value: false });
    await expect(resolveContent({ argument: "argument", stdin })).resolves.toBe(
      "argument"
    );
  });
});
