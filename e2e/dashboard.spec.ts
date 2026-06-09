import { expect, test } from "@playwright/test";

test.describe("dashboard", () => {
  test("shows the seeded patients and stats", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Nurse dashboard" })).toBeVisible();
    await expect(page.getByText("Monitored patients")).toBeVisible();
    // Mrs. Chan appears in the focused card and/or the table.
    await expect(page.getByText("Mrs. Chan").first()).toBeVisible();
  });

  test("severity filter narrows the table", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /^Escalate/ }).click();
    await expect(page.getByText("Mrs. Chan").first()).toBeVisible();
    await expect(page.getByText("Mrs. Wong")).toHaveCount(0);
  });
});
