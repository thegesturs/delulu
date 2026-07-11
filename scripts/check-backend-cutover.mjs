import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = resolve("apps/app");
const allowedLegacyServerFiles = new Set([
  "app/api/callback/[provider]/route.ts",
]);
const forbidden = [
  "@/trpc",
  "@delulu/database",
  "convex/react",
  "convex-helpers",
];

const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".next", "node_modules"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if ([".ts", ".tsx"].includes(extname(entry.name))) files.push(path);
  }
}

await walk(root);
const violations = [];
for (const file of files) {
  const path = relative(root, file);
  if (allowedLegacyServerFiles.has(path)) continue;
  const source = await readFile(file, "utf8");
  for (const token of forbidden) {
    if (source.includes(token)) violations.push(`${path}: ${token}`);
  }
}

if (violations.length > 0) {
  console.error("Legacy backend imports remain:\n" + violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Authenticated app backend cutover boundary is clean.");
}
