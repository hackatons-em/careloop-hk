import { defineConfig, devices } from "@playwright/test";

// E2E suite. Requirements:
//  - a DEDICATED Supabase test project (never production) with migrations
//    applied and one admin user provisioned,
//  - env: SUPABASE_* + NEXT_PUBLIC_SUPABASE_* + DEMO_MODE=true +
//    E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
// Global setup signs in once (storageState) and resets the demo dataset, so
// specs run against a deterministic seed. workers:1 because state is shared.
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    storageState: "e2e/.auth/admin.json",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
