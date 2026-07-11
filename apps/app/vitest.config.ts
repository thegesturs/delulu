import path from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "@delulu/testing";
import { defineConfig } from "vitest/config";

export default defineConfig({
  ...baseConfig,
  resolve: {
    ...baseConfig.resolve,
    alias: [
      {
        find: "@delulu/client",
        replacement: fileURLToPath(
          new URL("../../packages/client/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@delulu/core/domain",
        replacement: path.resolve("../../packages/core/src/domain"),
      },
      {
        find: "@delulu/core/kernel",
        replacement: path.resolve("../../packages/core/src/kernel"),
      },
      {
        find: /^@delulu\/core$/,
        replacement: path.resolve("../../packages/core/src/index.ts"),
      },
      {
        find: /^@delulu\/contracts$/,
        replacement: path.resolve("../../packages/contracts/src/index.ts"),
      },
      { find: "@delulu", replacement: path.resolve("../../packages") },
      { find: "@", replacement: path.resolve(".") },
    ],
  },
});
