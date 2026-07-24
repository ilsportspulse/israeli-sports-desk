#!/usr/bin/env node
// One-time X login for the ILSP auto-poster.
//
// Opens a real Chromium window using the same profile the auto-poster uses.
// Log into X (@ilsportspulse) once; the session is saved to the profile and the
// auto-poster reuses it unattended afterwards. Re-run only if X logs you out.
//
// Usage: node scripts/x-login.mjs

import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";

const PROFILE_DIR = join(homedir(), ".ilsp-x-profile");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1100, height: 900 },
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto("https://x.com/login");

console.log("\n➡  Log in as @ilsportspulse in the window that opened.");
console.log("   Waiting until you reach the X home timeline…\n");

// Wait until logged in: the compose/home UI exposes the tweet button / primary column.
try {
  await page.waitForURL(/x\.com\/home|x\.com\/?$/, { timeout: 300000 });
  await page
    .locator('[data-testid="SideNav_NewTweet_Button"], [data-testid="tweetButtonInline"]')
    .first()
    .waitFor({ timeout: 300000 });
  console.log("✓ Logged in. Session saved. You can close this window.");
} catch {
  console.log("⚠ Didn't detect a completed login within 5 min. If you did log in, it's still saved.");
}

await sleep(4000);
await ctx.close();
