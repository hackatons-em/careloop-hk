import { expect, test } from "@playwright/test";

test.describe("alert queue", () => {
  test("shows the escalate alert and acknowledges it", async ({ page }) => {
    await page.goto("/alerts");
    await expect(page.getByRole("heading", { name: "Nurse review queue" })).toBeVisible();

    // The risky check-in from global setup guarantees one open alert for Mrs. Chan.
    const card = page
      .locator("div")
      .filter({ has: page.getByRole("link", { name: "Mrs. Chan" }) })
      .filter({ has: page.getByRole("button", { name: "Acknowledge" }) })
      .last();
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Acknowledge" }).click();
    await expect(page.getByText("Alert acknowledged").first()).toBeVisible();
  });
});
