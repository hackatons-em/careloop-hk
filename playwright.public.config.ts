import { defineConfig, devices } from "@playwright/test";

// Public-pages-only e2e run against an already-running server (no Supabase
// service key required). Used locally when the full suite's webServer can't
// boot; assertions are identical to the main suite.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /anon\.spec\.ts|contact\.spec\.ts/,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    storageState: { cookies: [], origins: [] },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
