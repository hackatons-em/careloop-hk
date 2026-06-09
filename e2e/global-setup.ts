import { mkdirSync } from "node:fs";
import { chromium, type FullConfig } from "@playwright/test";

// Signs in as the E2E admin once, persists the session (storageState), then
// resets the demo dataset + replays the risky check-in so every spec starts
// from the same deterministic state (5 patients, 1 open escalate alert).
export default async function globalSetup(config: FullConfig) {
  const baseURL =
    (config.projects[0]?.use?.baseURL as string | undefined) ??
    process.env.E2E_BASE_URL ??
    "http://localhost:3000";
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required for the E2E suite.");
  }

  mkdirSync("e2e/.auth", { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  // Deterministic seed (admin + DEMO_MODE required).
  const reset = await page.request.post("/api/demo/reset");
  if (!reset.ok()) {
    throw new Error(`Demo reset failed (${reset.status()}): ${await reset.text()}`);
  }
  const risky = await page.request.post("/api/demo/run-risky-checkin");
  if (!risky.ok()) {
    throw new Error(`Risky check-in failed (${risky.status()}): ${await risky.text()}`);
  }

  await page.context().storageState({ path: "e2e/.auth/admin.json" });
  await browser.close();
}
