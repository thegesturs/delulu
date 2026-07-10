import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 180_000, // 3 minutes for real API calls
    exclude: ["**/*.integration.test.ts", "node_modules/**"],
  },
});
