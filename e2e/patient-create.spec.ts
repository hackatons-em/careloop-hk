import { expect, test } from "@playwright/test";

test.describe("patient creation", () => {
  test("creates a patient through the form", async ({ page }) => {
    await page.goto("/patients/new");
    await expect(page.getByRole("heading", { name: "Add a patient" })).toBeVisible();

    const name = `E2E Patient ${Date.now()}`;
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Age").fill("81");
    await page.getByLabel("Language").fill("Cantonese");
    await page.getByLabel("Living situation").fill("lives with family");
    await page.getByLabel("Conditions").fill("heart failure");
    await page.getByLabel("Conditions").press("Enter");
    await page.getByLabel("Assigned nurse").fill("Nurse E2E");
    await page.getByLabel("Baseline weight (kg)").fill("60");
    await page.getByLabel("Baseline steps / day").fill("3000");

    await page.getByRole("button", { name: "Create patient" }).click();
    await page.waitForURL("**/patients/**");
    await expect(page.getByRole("heading", { name })).toBeVisible();
  });

  test("rejects an empty submit with field errors", async ({ page }) => {
    await page.goto("/patients/new");
    await page.getByRole("button", { name: "Create patient" }).click();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page).toHaveURL(/\/patients\/new/);
  });
});
