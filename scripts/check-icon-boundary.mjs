import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const publicIconSpec = "npm:@hugeicons/core-free-icons@^3.1.1";
const manifestPaths = [
  "apps/app/package.json",
  "apps/web/package.json",
  "packages/design-system/package.json",
];
const sourceRoots = ["apps/app", "apps/web", "packages/design-system"];
const directIconPackages = [
  "@hugeicons/core-free-icons",
  "@hugeicons-pro/core-solid-rounded",
];
const violations = [];

for (const manifestPath of manifestPaths) {
  const manifest = JSON.parse(
    await readFile(resolve(root, manifestPath), "utf8")
  );
  if (manifest.dependencies?.["@delulu/icons"] !== publicIconSpec) {
    violations.push(
      `${manifestPath} must resolve @delulu/icons to ${publicIconSpec}`
    );
  }
}

async function inspectSource(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspectSource(path);
      continue;
    }
    if (!(entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      continue;
    }
    const source = await readFile(path, "utf8");
    for (const packageName of directIconPackages) {
      if (source.includes(`from "${packageName}"`)) {
        violations.push(
          `${relative(root, path)} imports ${packageName} directly; use @delulu/icons`
        );
      }
    }
  }
}

for (const sourceRoot of sourceRoots) {
  await inspectSource(resolve(root, sourceRoot));
}

const lockfile = await readFile(resolve(root, "pnpm-lock.yaml"), "utf8");
if (lockfile.includes("@hugeicons-pro/")) {
  violations.push("pnpm-lock.yaml must not contain licensed Pro packages");
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Icon boundary is Community-safe.");
}
