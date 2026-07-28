// Opent een ZICHTBAAR browservenster met de ingelogde @ilsportspulse-sessie,
// zodat Patrick eenmalige handelingen zelf kan doen (bv. X Chat-passcode
// instellen). Venster sluiten = klaar; de sessie blijft bewaard in het profiel.
import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";

const url = process.argv[2] ?? "https://x.com/i/chat";
const ctx = await chromium.launchPersistentContext(path.join(os.homedir(), ".ilsp-x-profile"), {
  headless: false,
  viewport: { width: 1280, height: 900 },
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
console.log("Venster open — doe je ding en sluit het venster als je klaar bent.");
await new Promise((resolve) => ctx.on("close", resolve));
