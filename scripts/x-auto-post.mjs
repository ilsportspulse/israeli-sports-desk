#!/usr/bin/env node
// ILSP → X auto-poster (browser, free, no API).
//
// Posts the newest Israeli-desk articles from the live site to @ilsportspulse
// via a logged-in Chromium profile — no X API, no credits, no third party.
//
// It reads the live RSS feed, keeps only Israeli stories, skips anything it has
// already tweeted (state file), and posts up to a small paced batch per run so a
// scheduler (launchd, every ~30 min) drips them out human-like instead of dumping
// dozens at once (which gets a fresh account flagged).
//
// One-time setup (on the machine that will run this): `node scripts/x-login.mjs`
// and log into X once. After that this script runs unattended.
//
// Env knobs:
//   X_MAX_PER_RUN   posts per invocation      (default 4)
//   X_MAX_PER_DAY   hard daily cap            (default 20)
//   X_MIN_GAP_SEC   seconds between posts     (default 45)
//   X_HEADLESS      "0" to watch it run       (default headless)
//   X_FEED_URL      feed to read              (default live feed-israel.xml, falls back to feed.xml)

import { chromium } from "playwright";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";

const PROFILE_DIR = join(homedir(), ".ilsp-x-profile");
const STATE_FILE = join(homedir(), ".ilsp-x-posted.json");
const LOG_FILE = join(homedir(), ".ilsp-x-post.log");

const MAX_PER_RUN = Number(process.env.X_MAX_PER_RUN ?? 4);
const MAX_PER_DAY = Number(process.env.X_MAX_PER_DAY ?? 20);
const MIN_GAP_SEC = Number(process.env.X_MIN_GAP_SEC ?? 45);
const HEADLESS = process.env.X_HEADLESS !== "0";
const PRIMARY_FEED = process.env.X_FEED_URL ?? "https://ilsportspulse.com/feed-israel.xml";
const FALLBACK_FEED = "https://ilsportspulse.com/feed.xml";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(LOG_FILE, line + "\n");
  } catch {}
}

// State: { posted: { <url>: <iso> }, day: "YYYY-MM-DD", dayCount: n }
function loadState() {
  if (!existsSync(STATE_FILE)) return { posted: {}, day: "", dayCount: 0 };
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { posted: {}, day: "", dayCount: 0 };
  }
}
function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

// Minimal RSS item parser — pulls title/link/category/pubDate from <item> blocks.
function parseFeed(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const pick = (tag) => {
      const t = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return t ? decodeEntities(t[1].trim()) : "";
    };
    items.push({
      title: pick("title"),
      link: pick("link"),
      category: pick("category"),
      pubDate: pick("pubDate"),
    });
  }
  return items;
}

const isIsraeli = (it) => /^israeli|israelis abroad/i.test(it.category || "");

function hashtag(category) {
  if (/basket/i.test(category)) return "#IsraeliBasketball";
  if (/football|soccer/i.test(category)) return "#IsraeliFootball";
  return "#IsraeliSport";
}

function composeText(it) {
  return `${it.title}\n\n${it.link}\n\n${hashtag(it.category)} #Israel`;
}

async function fetchFeed() {
  for (const url of [PRIMARY_FEED, FALLBACK_FEED]) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "ilsp-x-poster" } });
      if (!res.ok) continue;
      const xml = await res.text();
      let items = parseFeed(xml).filter((it) => it.link);
      // feed.xml is mixed; feed-israel.xml is pre-filtered. Filter either way.
      const israeli = items.filter(isIsraeli);
      const use = israeli.length ? israeli : items; // feed-israel.xml has no category → keep all
      if (use.length) {
        log(`Feed ${url}: ${use.length} Israeli items.`);
        return use;
      }
    } catch (e) {
      log(`Feed ${url} failed: ${e.message}`);
    }
  }
  return [];
}

async function postOne(page, text, link) {
  const url = "https://x.com/intent/post?text=" + encodeURIComponent(text);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

  // Guard: if we got bounced to a login page, the profile isn't authenticated.
  if (/\/login|\/i\/flow\/login/.test(page.url())) {
    throw new Error("NOT_LOGGED_IN");
  }

  const editor = page.locator('[data-testid="tweetTextarea_0"]');
  await editor.waitFor({ state: "visible", timeout: 20000 });

  // Wait for the Post button to become enabled (link-preview card must finish loading).
  const postBtn = page.locator('[data-testid="tweetButton"]').last();
  await postBtn.waitFor({ state: "visible", timeout: 20000 });
  for (let i = 0; i < 30; i++) {
    const disabled = await postBtn.getAttribute("aria-disabled");
    if (disabled !== "true") break;
    await sleep(500);
  }

  await postBtn.click();

  // Success = composer closes / toast appears / URL leaves intent.
  try {
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="tweetTextarea_0"]'),
      { timeout: 15000 }
    );
  } catch {
    // Fallback: a second click in case the first landed while still disabled.
    if (await postBtn.isVisible().catch(() => false)) await postBtn.click().catch(() => {});
    await sleep(3000);
  }
  return true;
}

async function main() {
  const state = loadState();
  const today = new Date().toISOString().slice(0, 10);
  if (state.day !== today) {
    state.day = today;
    state.dayCount = 0;
  }
  if (state.dayCount >= MAX_PER_DAY) {
    log(`Daily cap reached (${state.dayCount}/${MAX_PER_DAY}). Nothing to do.`);
    return;
  }

  const items = await fetchFeed();
  if (!items.length) {
    log("No feed items — aborting.");
    return;
  }

  // Newest first, skip already-posted, respect per-run and per-day budget.
  items.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  const budget = Math.min(MAX_PER_RUN, MAX_PER_DAY - state.dayCount);
  const queue = items.filter((it) => !state.posted[it.link]).slice(0, budget);

  if (!queue.length) {
    log("Nothing new to post.");
    return;
  }
  log(`Queue: ${queue.length} post(s) this run (day ${state.dayCount}/${MAX_PER_DAY}).`);

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: HEADLESS,
    viewport: { width: 1100, height: 900 },
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  let done = 0;
  try {
    for (const it of queue) {
      try {
        await postOne(page, composeText(it), it.link);
        state.posted[it.link] = new Date().toISOString();
        state.dayCount++;
        done++;
        saveState(state);
        log(`✓ Posted: ${it.title}`);
        if (done < queue.length) await sleep(MIN_GAP_SEC * 1000);
      } catch (e) {
        if (e.message === "NOT_LOGGED_IN") {
          log("✗ Profile not logged in. Run: node scripts/x-login.mjs");
          break;
        }
        log(`✗ Failed "${it.title}": ${e.message}`);
        await sleep(5000);
      }
    }
  } finally {
    await ctx.close();
  }
  log(`Run complete: ${done} posted, ${state.dayCount}/${MAX_PER_DAY} today.`);
}

main().catch((e) => {
  log(`FATAL: ${e.stack || e.message}`);
  process.exit(1);
});
