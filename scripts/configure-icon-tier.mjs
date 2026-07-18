import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const tiers = {
  free: "npm:@hugeicons/core-free-icons@^3.1.1",
  pro: "npm:@hugeicons-pro/core-solid-rounded@^3.1.0",
};

const tier = process.argv[2];
if (tier in tiers) {
  const root = process.cwd();
  const manifests = [
    "apps/app/package.json",
    "apps/web/package.json",
    "packages/design-system/package.json",
  ];

  for (const relativePath of manifests) {
    const path = resolve(root, relativePath);
    const manifest = JSON.parse(await readFile(path, "utf8"));
    const dependencies = manifest.dependencies ?? {};
    const nextDependencies = {};
    let inserted = false;

    for (const [name, version] of Object.entries(dependencies)) {
      if (
        name === "@delulu/icons" ||
        name === "@hugeicons/core-free-icons" ||
        name === "@hugeicons-pro/core-solid-rounded"
      ) {
        if (!inserted) {
          nextDependencies["@delulu/icons"] = tiers[tier];
          inserted = true;
        }
      } else {
        nextDependencies[name] = version;
      }
    }

    if (!inserted) {
      nextDependencies["@delulu/icons"] = tiers[tier];
    }

    manifest.dependencies = nextDependencies;
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  console.log(`Configured the ${tier} icon tier in workspace manifests.`);
  if (tier === "pro") {
    console.log(
      "Configure the licensed @hugeicons-pro registry outside the repository, then run pnpm install --no-frozen-lockfile."
    );
    console.log(
      "Use this only in a private build environment; do not commit a Pro-resolved lockfile or registry token."
    );
  } else {
    console.log("Run pnpm install to restore the public Community lockfile.");
  }
} else {
  console.error("Usage: pnpm icons:free | pnpm icons:pro");
  process.exitCode = 2;
}
