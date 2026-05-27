import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.mjs"],
    include: ["tests/**/*.test.{js,mjs,jsx,ts,tsx}"],
    exclude: ["tests/e2e/**"],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
  },
});