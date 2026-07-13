import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const roots = [
  "apps/app",
  "apps/api",
  "packages/connections",
  "packages/infrastructure",
  "packages/worker",
];
const forbidden = [
  "@/trpc",
  "@delulu/api",
  "@delulu/database",
  "@delulu/rate-limit",
  "convex/react",
  "convex-helpers",
  "NEXT_PUBLIC_CONVEX_URL",
  "CONVEX_URL",
];

const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".next", "node_modules"].includes(entry.name)) {
      continue;
    }
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
    } else if ([".ts", ".tsx"].includes(extname(entry.name))) {
      files.push(path);
    }
  }
}

for (const root of roots) {
  await walk(resolve(root));
}
const violations = [];
for (const file of files) {
  const path = relative(process.cwd(), file);
  const source = await readFile(file, "utf8");
  for (const token of forbidden) {
    if (source.includes(token)) {
      violations.push(`${path}: ${token}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Legacy backend imports remain:\n" + violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Runtime backend cutover boundary is clean.");
}
