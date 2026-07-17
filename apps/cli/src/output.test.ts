import { decode } from "@toon-format/toon";
import { describe, expect, it } from "vitest";
import { CliError } from "./cli-error.js";
import {
  formatError,
  formatResult,
  resolveOutputMode,
  truncateText,
} from "./output.js";

describe("CLI output", () => {
  it("uses pretty output for terminals and TOON for pipes", () => {
    expect(resolveOutputMode({}, true)).toBe("pretty");
    expect(resolveOutputMode({}, false)).toBe("toon");
  });

  it("emits deterministic decodable TOON envelopes", () => {
    const encoded = formatResult(
      {
        status: "ok",
        message: "2 posts",
        summary: { returned: 2, total: 2 },
        data: [
          { id: "post_1", state: "draft", when: null, caption: "One" },
          { id: "post_2", state: "published", when: null, caption: "Two" },
        ],
        next: ["delulu show post_1"],
      },
      "toon"
    );
    expect(decode(encoded)).toEqual({
      schema: "delulu.cli/v1",
      status: "ok",
      message: "2 posts",
      summary: { returned: 2, total: 2 },
      data: [
        { id: "post_1", state: "draft", when: null, caption: "One" },
        { id: "post_2", state: "published", when: null, caption: "Two" },
      ],
      next: ["delulu show post_1"],
    });
  });

  it("uses the same structured error in TOON and JSON", () => {
    const error = new CliError({
      code: "AUTH_REQUIRED",
      message: "Log in",
      exitCode: 3,
      next: ["delulu login"],
    });
    expect(decode(formatError(error, "toon"))).toEqual(
      JSON.parse(formatError(error, "json"))
    );
  });

  it("includes explicit state in pretty output without pipe colors", () => {
    const output = formatResult(
      { status: "ok", message: "Done", data: [] },
      "pretty"
    );
    expect(output).toContain("status: ok");
    expect(output).not.toContain("\u001b[");
  });

  it("truncates with an exact omitted-size hint", () => {
    expect(truncateText("abcdefgh", 5)).toBe("abcde… [+3 chars]");
    expect(truncateText("abcdefgh", 5, true)).toBe("abcdefgh");
  });
});
