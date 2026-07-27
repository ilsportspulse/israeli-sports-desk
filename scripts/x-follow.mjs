#!/usr/bin/env node
// Follow curated accounts from config/x-follow-list.json with the logged-in
// ILSP X browser profile (~/.ilsp-x-profile — the same session the auto-poster
// uses). Follows happen in small daily batches to stay far under X's
// aggressive-follow heuristics for young accounts.
//
//   node scripts/x-follow.mjs                 # follow next batch (default 35)
//   X_FOLLOW_MAX=10 node scripts/x-follow.mjs # smaller batch
//   X_HEADLESS=0 node scripts/x-follow.mjs    # watch it run
//
// State lives in ~/.ilsp-x-followed.json so every run continues where the
// previous one stopped. The x-auto-post launchd job shares the browser profile;
// stop it first (launchctl unload) if a run overlaps, or run this between its
// half-hourly slots — a locked profile makes this script exit without changes.

import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROFILE_DIR = join(homedir(), ".ilsp-x-profile");
const STATE_FILE = join(homedir(), ".ilsp-x-followed.json");
const LOG_FILE = join(homedir(), ".ilsp-x-follow.log");
const LIST_FILE = join(root, "config", "x-follow-list.json");
const MAX_PER_RUN = Number(process.env.X_FOLLOW_MAX ?? 35);
const HEADLESS = process.env.X_HEADLESS !== "0";
const GAP_MS = [6000, 14000]; // human-ish pause between follows

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch { /* best effort */ }
};

const state = existsSync(STATE_FILE)
  ? JSON.parse(readFileSync(STATE_FILE, "utf8"))
  : { followed: {}, failed: {} };
const list = JSON.parse(readFileSync(LIST_FILE, "utf8")).accounts;

const queue = list
  .filter((a) => a.handle && !state.followed[a.handle] && (state.failed[a.handle] ?? 0) < 3)
  .slice(0, MAX_PER_RUN);

if (!queue.length) {
  log("Nothing to do — follow list fully processed.");
  process.exit(0);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => wait(GAP_MS[0] + Math.random() * (GAP_MS[1] - GAP_MS[0]));

let ctx;
try {
  ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: HEADLESS,
    viewport: { width: 1100, height: 900 },
  });
} catch (e) {
  log(`Profile busy or unavailable (${e.message?.split("\n")[0]}) — try again later.`);
  process.exit(0);
}

const page = ctx.pages()[0] ?? (await ctx.newPage());
let done = 0;
try {
  for (const acc of queue) {
    const handle = acc.handle.replace(/^@/, "");
    try {
      await page.goto(`https://x.com/${handle}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await wait(2500);

      // Already following? X renders a button whose test-id ends in "-unfollow".
      const unfollowBtn = page.locator('[data-testid$="-unfollow"]').first();
      if (await unfollowBtn.count()) {
        state.followed[acc.handle] = new Date().toISOString();
        log(`Already following ${acc.handle}`);
        continue;
      }

      const followBtn = page.locator('[data-testid$="-follow"]').first();
      if (!(await followBtn.count())) {
        state.failed[acc.handle] = (state.failed[acc.handle] ?? 0) + 1;
        log(`No follow button on ${acc.handle} (suspended/renamed/not logged in?)`);
        continue;
      }
      await followBtn.click();
      await wait(2000);

      // Confirm the button flipped to "Following".
      if (await page.locator('[data-testid$="-unfollow"]').first().count()) {
        state.followed[acc.handle] = new Date().toISOString();
        done++;
        log(`Followed ${acc.handle} (${acc.name})`);
      } else {
        state.failed[acc.handle] = (state.failed[acc.handle] ?? 0) + 1;
        log(`Follow click did not stick on ${acc.handle}`);
      }
      await pause();
    } catch (e) {
      state.failed[acc.handle] = (state.failed[acc.handle] ?? 0) + 1;
      log(`Error on ${acc.handle}: ${e.message?.split("\n")[0]}`);
    }
  }
} finally {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  await ctx.close();
}
const remaining = list.filter((a) => a.handle && !state.followed[a.handle] && (state.failed[a.handle] ?? 0) < 3).length;
log(`Batch done — ${done} newly followed, ${remaining} remaining in list.`);
