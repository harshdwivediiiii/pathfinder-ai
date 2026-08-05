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
    command: isCI
      ? "DATABASE_URL=postgresql://test:test@localhost:5432/test sh -c 'mkdir -p .next/standalone/public .next/standalone/.next/static && cp -r public/* .next/standalone/public/ 2>/dev/null || true && cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true && PORT=3000 node .next/standalone/server.js'"
      : "npm run dev -- --port 3000 -H 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !isCI,
    timeout: 180000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      NODE_ENV: isCI ? "production" : "development",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_ZHVtbXkuY2xlcmsuYWNjb3VudHMuZGV2JA",
      CLERK_SECRET_KEY: "sk_test_dummy",
    },
  },
});