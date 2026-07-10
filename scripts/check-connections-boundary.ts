import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const forbiddenFiles = new Set(["publish-registry.ts", "runtime.ts"]);
const forbiddenPackages = new Set(["axios", "googleapis"]);
const connectionsSourceAlias = /^@delulu\/connections\/src\/(.+)$/;
const connectionsSource = resolve(
  import.meta.dirname,
  "../packages/connections/src"
);
const specifierPatterns = [
  /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
];

const specifiers = (source: string): string[] =>
  specifierPatterns.flatMap((pattern) =>
    Array.from(source.matchAll(pattern), (match) => match[1]).filter(
      (specifier): specifier is string => specifier !== undefined
    )
  );

const resolveModule = (from: string, specifier: string): string | undefined => {
  const base = resolve(dirname(from), specifier);
  for (const candidate of [base, `${base}.ts`, resolve(base, "index.ts")]) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
};

const resolveConnectionsAlias = (specifier: string): string | undefined => {
  if (specifier === "@delulu/connections") {
    return resolve(connectionsSource, "index.ts");
  }
  if (specifier === "@delulu/connections/worker") {
    return resolve(connectionsSource, "worker-entry.ts");
  }
  const sourcePath = specifier.match(connectionsSourceAlias)?.[1];
  return sourcePath
    ? resolveModule(resolve(connectionsSource, "index.ts"), `./${sourcePath}`)
    : undefined;
};

export const findBoundaryViolations = (entry: string): string[] => {
  const violations: string[] = [];
  const visited = new Set<string>();
  const walk = (file: string, chain: string[]) => {
    if (visited.has(file)) {
      return;
    }
    visited.add(file);
    if (forbiddenFiles.has(file.split("/").at(-1) ?? "")) {
      violations.push([...chain, file].join(" -> "));
    }
    const source = readFileSync(file, "utf8");
    for (const specifier of specifiers(source)) {
      const packageName = specifier.startsWith("@")
        ? specifier.split("/").slice(0, 2).join("/")
        : specifier.split("/")[0];
      if (forbiddenPackages.has(packageName)) {
        violations.push([...chain, file, specifier].join(" -> "));
      } else if (specifier.startsWith(".")) {
        const resolved = resolveModule(file, specifier);
        if (resolved) {
          walk(resolved, [...chain, file]);
        }
      } else {
        const resolved = resolveConnectionsAlias(specifier);
        if (resolved) {
          walk(resolved, [...chain, file]);
        }
      }
    }
  };
  walk(resolve(entry), []);
  return [...new Set(violations)];
};

const run = () => {
  const root = resolve(import.meta.dirname, "..");
  const entry = resolve(root, "packages/connections/src/index.ts");
  const violations = findBoundaryViolations(entry);
  if (violations.length > 0) {
    console.error("Connections Workers-safe export boundary was crossed:");
    for (const violation of violations) {
      console.error(`- ${violation.split(root).join(".")}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`Verified ${relative(root, entry)} is Workers-safe`);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}
