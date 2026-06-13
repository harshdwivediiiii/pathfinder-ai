import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.mjs"],
    include: ["tests/**/*.test.{js,mjs,jsx,ts,tsx}"],
    exclude: ["tests/e2e/**"],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    env: {
      NODE_ENV: "test",
    },
  },
});