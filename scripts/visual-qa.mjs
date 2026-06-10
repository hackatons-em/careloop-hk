// Visual QA capture suite for the landing page.
//
//   node scripts/visual-qa.mjs <baseURL> <runName>
//   e.g. node scripts/visual-qa.mjs http://localhost:3100 loop0
//
// Produces full-page screenshots at 5 widths x 2 locales, above-the-fold shots
// at the two common laptop sizes, a reduced-motion shot, and a keyboard-walk
// series, under .visual-qa/<runName>/.

import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const baseURL = process.argv[2] ?? "http://localhost:3100";
const runName = process.argv[3] ?? "run";
const outDir = `.visual-qa/${runName}`;
mkdirSync(outDir, { recursive: true });

const host = new URL(baseURL).hostname;
const VIEWPORTS = [
  { w: 360, h: 800 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1440, h: 900 },
  { w: 1920, h: 1080 },
];
const LOCALES = ["en", "zh-HK"];

function cookieFor(locale) {
  return {
    name: "careloop_locale",
    value: locale,
    domain: host,
    path: "/",
    httpOnly: true,
    secure: baseURL.startsWith("https"),
    sameSite: "Lax",
  };
}

async function settle(page) {
  await page.waitForLoadState("networkidle");
  // Let cl-rise entrance animations (0.55s + stagger) finish.
  await page.waitForTimeout(1200);
}

const browser = await chromium.launch();
try {
  // Full-page suite: widths x locales.
  for (const locale of LOCALES) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      if (locale !== "en") await ctx.addCookies([cookieFor(locale)]);
      const page = await ctx.newPage();
      await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
      await settle(page);
      await page.screenshot({ path: `${outDir}/full-${locale}-${vp.w}.png`, fullPage: true });
      await ctx.close();
      console.log(`shot full-${locale}-${vp.w}`);
    }
  }

  // Above-the-fold only: the two common laptop sizes (en + zh at 1366).
  for (const fold of [
    { w: 1440, h: 900, locale: "en" },
    { w: 1366, h: 768, locale: "en" },
    { w: 1366, h: 768, locale: "zh-HK" },
  ]) {
    const ctx = await browser.newContext({ viewport: { width: fold.w, height: fold.h } });
    if (fold.locale !== "en") await ctx.addCookies([cookieFor(fold.locale)]);
    const page = await ctx.newPage();
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.screenshot({ path: `${outDir}/fold-${fold.locale}-${fold.w}x${fold.h}.png` });
    await ctx.close();
    console.log(`shot fold-${fold.locale}-${fold.w}x${fold.h}`);
  }

  // Reduced motion.
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/reduced-motion-1440.png` });
    await ctx.close();
    console.log("shot reduced-motion-1440");
  }

  // Keyboard walk: tab through the first 10 stops, shoot the viewport each time.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    await settle(page);
    for (let i = 1; i <= 10; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(120);
      // Ensure the focused element is in view for the shot.
      await page.evaluate(() =>
        document.activeElement?.scrollIntoView({ block: "center", behavior: "instant" }),
      );
      await page.waitForTimeout(80);
      const label = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return "none";
        const text = (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30);
        return `${el.tagName.toLowerCase()}-${text.replace(/[^\w一-鿿]+/g, "_")}`;
      });
      await page.screenshot({ path: `${outDir}/tab-${String(i).padStart(2, "0")}-${label}.png` });
      console.log(`shot tab-${i} (${label})`);
    }
    await ctx.close();
  }

  console.log(`done -> ${outDir}`);
} finally {
  await browser.close();
}
