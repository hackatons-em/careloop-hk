import { expect, test } from "@playwright/test";

// Anonymous access — no session cookie.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("anonymous access", () => {
  test("dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in to Miruwa" })).toBeVisible();
  });

  test("patient API returns 401", async ({ request }) => {
    const res = await request.get("/api/patients");
    expect(res.status()).toBe(401);
  });

  test("demo reset is not reachable", async ({ request }) => {
    const res = await request.post("/api/demo/reset");
    expect([401, 403, 404]).toContain(res.status());
  });

  test("landing page renders with no patient data", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Miruwa");
    const html = await page.content();
    // Seeded patient names must never appear in public HTML.
    expect(html).not.toContain("Mrs. Wong");
    expect(html).not.toContain("Mr. Lee");
  });
});
