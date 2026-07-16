import { fstatSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import { CliError } from "./cli-error.js";

type ContentStream = Readable & {
  readonly isTTY?: boolean;
  readonly fd?: number;
};

const readStdin = async (stream: ContentStream) => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
};

export const resolveContent = async (input: {
  readonly argument?: string;
  readonly file?: string;
  readonly stdin?: ContentStream;
  readonly required?: boolean;
}) => {
  const hasStdin = Boolean(
    input.stdin &&
      !input.stdin.isTTY &&
      (typeof input.stdin.fd !== "number" ||
        (() => {
          const descriptor = fstatSync(input.stdin.fd);
          return (
            descriptor.isFIFO() || descriptor.isFile() || descriptor.isSocket()
          );
        })())
  );
  const count = [
    input.argument !== undefined,
    input.file !== undefined,
    hasStdin,
  ].filter(Boolean).length;
  if (count > 1) {
    throw new CliError({
      code: "AMBIGUOUS_CONTENT",
      message:
        "Use exactly one content source: caption argument, --file, or stdin",
      exitCode: 2,
    });
  }
  if (count === 0) {
    if (input.required) {
      throw new CliError({
        code: "CONTENT_REQUIRED",
        message: "Provide a caption argument, --file, or piped stdin",
        exitCode: 2,
      });
    }
    return undefined;
  }
  const value = input.file
    ? await readFile(input.file, "utf8")
    : hasStdin
      ? await readStdin(input.stdin as ContentStream)
      : input.argument;
  const normalized = value?.trim();
  if (input.required && !normalized) {
    throw new CliError({
      code: "CONTENT_REQUIRED",
      message: "Post content cannot be empty",
      exitCode: 2,
    });
  }
  return normalized;
};
