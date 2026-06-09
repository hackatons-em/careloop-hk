import { expect, test } from "@playwright/test";

test.describe("patient detail", () => {
  test("opens Mrs. Chan from the dashboard and shows the timeline", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Mrs. Chan" }).first().click();
    await page.waitForURL("**/patients/**");

    await expect(page.getByRole("heading", { name: "Mrs. Chan" })).toBeVisible();
    await expect(page.getByText("Weight (kg)")).toBeVisible();
    await expect(page.getByText("Blood pressure (mmHg)")).toBeVisible();
    // Risk severity badge is rendered in the header.
    await expect(page.getByText(/Escalate|Review today|Watch|Stable/).first()).toBeVisible();
  });

  test("unknown patient id shows the 404 page", async ({ page }) => {
    await page.goto("/patients/does-not-exist");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
