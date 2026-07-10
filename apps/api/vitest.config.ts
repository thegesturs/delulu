import { defineConfig } from "vitest/config";
export default defineConfig({
  // The e2e suite needs Postgres; it runs via `test:integration`, not `test`.
  test: {
    exclude: ["test/**", "node_modules/**"],
    passWithNoTests: true,
  },
});
