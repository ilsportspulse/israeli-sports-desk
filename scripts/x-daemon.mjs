// Permanente X-browsersessie op de iMac: één zichtbaar venster dat open blijft,
// met CDP-poort zodat outreach/scan-scripts de ONTGRENDELDE sessie hergebruiken
// (X Chat-passcode is per browserinstantie — dit venster is dé instantie).
import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";

const ctx = await chromium.launchPersistentContext(path.join(os.homedir(), ".ilsp-x-profile"), {
  headless: false,
  viewport: { width: 1360, height: 940 },
  args: ["--remote-debugging-port=9666"],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto(process.argv[2] ?? "https://x.com/i/premium_sign_up", { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => {});
const chat = await ctx.newPage();
await chat.goto("https://x.com/i/chat", { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => {});
console.log("X-daemon actief (CDP :9666). Venster open laten — scripts verbinden hierop.");
await new Promise((resolve) => ctx.on("close", resolve));
console.log("X-daemon gestopt (venster gesloten).");
