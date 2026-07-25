import { readFileSync } from "node:fs";

interface PackageMetadata {
  readonly version?: unknown;
}

const packageMetadata = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
) as PackageMetadata;

if (
  typeof packageMetadata.version !== "string" ||
  packageMetadata.version.length === 0
) {
  throw new Error("CLI package version is missing");
}

export const CLI_VERSION = packageMetadata.version;
