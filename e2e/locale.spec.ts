import { expect, test } from "@playwright/test";

// Fresh context (no storageState, no cookie) — defaults must be English.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("locale switcher", () => {
  test("defaults to English, switches to Traditional Chinese, and persists", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in to Miruwa" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // Switch to 繁 via the footer toggle.
    await page.getByRole("button", { name: "繁" }).first().click();
    await expect(page.getByRole("heading", { name: "登入 Miruwa" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-HK");

    // Persists across reload.
    await page.reload();
    await expect(page.getByRole("heading", { name: "登入 Miruwa" })).toBeVisible();

    // Switch back.
    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(page.getByRole("heading", { name: "Sign in to Miruwa" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("switches to Arabic and applies RTL", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    // Switch to Arabic via the ع toggle.
    await page.getByRole("button", { name: "ع" }).first().click();
    await expect(page.getByRole("heading", { name: "تسجيل الدخول إلى Miruwa" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // Persists across reload.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "تسجيل الدخول إلى Miruwa" })).toBeVisible();
  });

  test("public marketing pages render in Chinese", async ({ page }) => {
    await page.goto("/pricing");
    await page.getByRole("button", { name: "繁" }).first().click();
    await expect(page.getByRole("heading", { name: "按合作模式收費" })).toBeVisible();

    await page.goto("/security");
    await expect(page.getByRole("heading", { name: "安全與信任" })).toBeVisible();
  });
});
