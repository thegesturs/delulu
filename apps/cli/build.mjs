import { cp, rm } from "node:fs/promises";
import { build } from "esbuild";

// Bundle the CLI (including @delulu/* workspace packages and effect) into a
// single standalone ESM file that runs under plain `node`. The createRequire
// banner lets bundled CommonJS deps (e.g. commander) resolve Node builtins.
await rm("dist", { recursive: true, force: true });
await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "dist/index.js",
  banner: {
    js: "import { createRequire as __cliCreateRequire } from 'node:module'; const require = __cliCreateRequire(import.meta.url);",
  },
});

await cp("../../skills/manage-social-publishing", "dist/skill", {
  recursive: true,
});
