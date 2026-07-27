#!/usr/bin/env node
// Read the ILSP X account's Following timeline with the logged-in browser
// profile and publish fresh posts from our curated sources as SIGNALS for the
// cloud newsroom (data/x-signals.json, uploaded via the GitHub contents API so
// no local git state can race the cloud cycle's pushes).
//
// Signals are DISCOVERY ONLY: the cloud cycle turns them into candidates and
// every article still passes the full drafting/verification/dedup gates. A
// tweet is never copied onto the site.
//
//   node scripts/x-signal-scan.mjs            # one scan
//   X_HEADLESS=0 node scripts/x-signal-scan.mjs
//
// Shares ~/.ilsp-x-profile with the auto-poster; if the profile is locked by a
// concurrent poster run this exits quietly and the next half-hourly slot retries.

import { readFileSync, appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROFILE_DIR = join(homedir(), ".ilsp-x-profile");
const LOG_FILE = join(homedir(), ".ilsp-x-signals.log");
const LIST_FILE = join(root, "config", "x-follow-list.json");
const HEADLESS = process.env.X_HEADLESS !== "0";
const MAX_SIGNALS = 200;          // rolling window in the published file
const FRESH_HOURS = 24;           // ignore older timeline items
const SCROLLS = 5;                // timeline depth per scan
const REPO = "ilsportspulse/israeli-sports-desk";
const FILE_PATH = "data/x-signals.json";
const OWN_HANDLE = "ilsportspulse";

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch { /* best effort */ }
};

const followed = new Set(
  JSON.parse(readFileSync(LIST_FILE, "utf8")).accounts.map((a) => a.handle.replace(/^@/, "").toLowerCase()),
);
const groupOf = new Map(
  JSON.parse(readFileSync(LIST_FILE, "utf8")).accounts.map((a) => [a.handle.replace(/^@/, "").toLowerCase(), a.group]),
);

function githubToken() {
  const out = spawnSync("git", ["credential-osxkeychain", "get"], {
    input: "protocol=https\nhost=github.com\n\n",
    encoding: "utf8",
  }).stdout ?? "";
  return out.match(/password=(\S+)/)?.[1];
}

async function fetchCurrent(token) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=main`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) return { sha: undefined, signals: [] };
  if (!res.ok) throw new Error(`GET contents ${res.status}`);
  const body = await res.json();
  const parsed = JSON.parse(Buffer.from(body.content, "base64").toString("utf8"));
  return { sha: body.sha, signals: parsed.signals ?? [] };
}

async function upload(token, payload, sha, attempt = 0) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({
      message: `X signals: ${new Date().toISOString().slice(0, 16)}Z`,
      content: Buffer.from(JSON.stringify(payload, null, 2) + "\n").toString("base64"),
      sha,
      branch: "main",
    }),
  });
  if (res.status === 409 && attempt < 3) {
    // Head moved (a newsroom cycle pushed) — refetch the blob sha and retry.
    const { sha: freshSha } = await fetchCurrent(token);
    return upload(token, payload, freshSha, attempt + 1);
  }
  if (!res.ok) throw new Error(`PUT contents ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

let ctx;
try {
  ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: HEADLESS,
    viewport: { width: 1100, height: 1400 },
  });
} catch (e) {
  log(`Profile busy (${e.message?.split("\n")[0]}) — skipping this scan.`);
  process.exit(0);
}

const collected = new Map(); // url -> signal
try {
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto("https://x.com/home", { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(4000);
  // The home timeline has For You / Following tabs; scan the FOLLOWING feed so
  // signals come only from the curated sources, not the algorithm.
  const followingTab = page.getByRole("tab", { name: /following/i }).first();
  if (await followingTab.count()) {
    await followingTab.click();
    await page.waitForTimeout(2500);
  }

  const cutoff = Date.now() - FRESH_HOURS * 60 * 60 * 1000;
  for (let s = 0; s <= SCROLLS; s++) {
    const tweets = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('[data-testid="tweet"]')) {
        const timeEl = el.querySelector("time[datetime]");
        const link = timeEl?.closest("a")?.getAttribute("href") ?? "";
        const textEl = el.querySelector('[data-testid="tweetText"]');
        const isRepost = Boolean(el.querySelector('[data-testid="socialContext"]'));
        out.push({
          link,
          datetime: timeEl?.getAttribute("datetime") ?? "",
          text: textEl?.innerText ?? "",
          isRepost,
        });
      }
      return out;
    });
    for (const t of tweets) {
      const m = t.link.match(/^\/([^/]+)\/status\/(\d+)/);
      if (!m) continue;
      const handle = m[1].toLowerCase();
      if (handle === OWN_HANDLE || !followed.has(handle)) continue;
      if (t.isRepost || !t.text.trim()) continue;
      const at = Date.parse(t.datetime);
      if (!Number.isFinite(at) || at < cutoff) continue;
      const url = `https://x.com/${m[1]}/status/${m[2]}`;
      if (!collected.has(url)) {
        collected.set(url, {
          url,
          handle: `@${m[1]}`,
          group: groupOf.get(handle) ?? "unknown",
          postedAt: new Date(at).toISOString(),
          seenAt: new Date().toISOString(),
          text: t.text.replace(/\s+/g, " ").trim().slice(0, 500),
        });
      }
    }
    if (s < SCROLLS) {
      await page.mouse.wheel(0, 2400);
      await page.waitForTimeout(1800);
    }
  }
} finally {
  await ctx.close();
}

log(`Scan: ${collected.size} fresh post(s) from curated sources.`);
if (!collected.size) process.exit(0);

const token = githubToken();
if (!token) { log("No GitHub token from keychain — signals not uploaded."); process.exit(0); }
const { sha, signals: existing } = await fetchCurrent(token);
const byUrl = new Map(existing.map((s) => [s.url, s]));
let added = 0;
for (const [url, sig] of collected) if (!byUrl.has(url)) { byUrl.set(url, sig); added++; }
if (!added) { log("No new signals since last upload."); process.exit(0); }
const merged = [...byUrl.values()]
  .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
  .slice(0, MAX_SIGNALS);
await upload(token, {
  updatedAt: new Date().toISOString(),
  note: "Discovery signals from the curated X follow list. Never published directly; every story passes the full drafting, verification and dedup gates.",
  signals: merged,
}, sha);
log(`Uploaded ${added} new signal(s); file now holds ${merged.length}.`);
