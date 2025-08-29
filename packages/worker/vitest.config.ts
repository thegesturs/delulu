import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    timeout: 30000, // 30 seconds per test
    hookTimeout: 30000, // 30 seconds for setup/teardown hooks
  },
  resolve: {
    alias: {
      '@': '.',
      '@delulu': '../',
    },
  },
})