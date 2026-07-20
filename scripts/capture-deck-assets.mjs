import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "outputs/deck-assets");
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await desktop.newPage();

for (const [name, url] of [
  ["homepage-desktop.png", "http://127.0.0.1:3000/"],
  ["brand-desktop.png", "http://127.0.0.1:3000/brand"],
  ["scores-desktop.png", "http://127.0.0.1:3000/scores"],
  ["brand-mark.png", "http://127.0.0.1:3000/brand/ilsp-mark.svg"],
  ["brand-lockup.png", "http://127.0.0.1:3000/brand/ilsp-lockup.svg"],
  ["brand-lockup-white.png", "http://127.0.0.1:3000/brand/ilsp-lockup-white.svg"],
  ["social-avatar.png", "http://127.0.0.1:3000/brand/ilsp-social-avatar.svg"],
  ["social-banner.png", "http://127.0.0.1:3000/brand/ilsp-social-banner.svg"],
]) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: false });
}

await page.goto("http://127.0.0.1:3000/brand", { waitUntil: "networkidle" });
await page.locator("section").filter({ hasText: "If it works on a shirt, it works everywhere." }).screenshot({ path: `${outDir}/brand-shirt-test.png` });
await page.locator("section").filter({ hasText: "Ready for profiles, decks and launch pages." }).screenshot({ path: `${outDir}/brand-assets-section.png` });

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mobilePage = await mobile.newPage();
await mobilePage.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
await mobilePage.screenshot({ path: `${outDir}/homepage-mobile.png`, fullPage: false });
await mobilePage.goto("http://127.0.0.1:3000/brand", { waitUntil: "networkidle" });
await mobilePage.locator("section").filter({ hasText: "If it works on a shirt, it works everywhere." }).screenshot({ path: `${outDir}/brand-shirt-mobile.png` });
await mobilePage.locator("section").filter({ hasText: "Ready for profiles, decks and launch pages." }).screenshot({ path: `${outDir}/brand-assets-mobile.png` });

await browser.close();
console.log(`Captured ILSP deck assets in ${outDir}`);
