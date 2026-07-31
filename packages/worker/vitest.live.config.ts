import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.live.test.ts"],
    fileParallelism: false,
    testTimeout: 10 * 60 * 1000,
  },
});
