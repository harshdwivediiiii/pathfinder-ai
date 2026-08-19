import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    // Authentication bypasses are intentionally rejected by production
    // middleware. The production bundle is verified by the separate build
    // step; run E2E against a localhost development server where the guarded
    // test-only bypass is permitted.
    command: "npm run dev -- --port 3000 -H 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !isCI,
    timeout: 180000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      E2E_TEST: "true",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_ZHVtbXkuY2xlcmsuYWNjb3VudHMuZGV2JA",
      CLERK_SECRET_KEY: "sk_test_dummy",
    },
  },
});
