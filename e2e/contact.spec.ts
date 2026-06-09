import { expect, test } from "@playwright/test";

// Public pages — no session needed.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("marketing + contact flow", () => {
  test("pricing, security, and contact pages render with nav", async ({ page }) => {
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: "Pricing that follows the engagement" }),
    ).toBeVisible();

    await page.goto("/security");
    await expect(page.getByRole("heading", { name: "Security & trust" })).toBeVisible();

    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Request a demo" })).toBeVisible();
  });

  test("contact?interest=pilot preselects the dropdown", async ({ page }) => {
    await page.goto("/contact?interest=pilot");
    await expect(page.getByLabel("What are you interested in?")).toHaveValue("pilot");
  });

  test("submits a demo request end to end", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Full name").fill("E2E Tester");
    await page.getByLabel("Organization").fill("E2E Hospital");
    await page.getByLabel("Work email").fill(`e2e-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("heading", { name: "Thanks — we've got it." })).toBeVisible();
  });

  test("rejects an empty submit with field errors", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Organization is required")).toBeVisible();
  });

  test("landing shows marketing sections and demo CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request a demo/ }).first()).toBeVisible();
  });
});
