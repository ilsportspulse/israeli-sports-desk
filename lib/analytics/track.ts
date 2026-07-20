import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

// Privacy-first, self-hosted analytics. No cookies, no third party. Visitors are
// identified only by a daily, salted, irreversible hash of (IP + UA + date), so a
// person cannot be tracked across days and the raw IP is never stored. Events are
// appended to per-day JSONL files.
//
// NOTE: on Vercel the serverless filesystem is ephemeral, so at scale this store
// should be pointed at Vercel KV/Postgres (the recordEvent/readEvents seam is where
// that swaps in). Locally and on any persistent-FS host it works as-is.

const DIR = path.join(process.cwd(), "data", "analytics");

export type AnalyticsEvent = {
  ts: string;
  day: string;
  vid: string; // daily visitor hash
  path: string;
  title?: string;
  refType: "direct" | "search" | "social" | "referral" | "internal";
  refDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device: "mobile" | "tablet" | "desktop" | "bot";
  os: string;
  browser: string;
  country?: string;
  city?: string;
  bot: boolean;
};

const SEARCH = ["google.", "bing.", "duckduckgo.", "yahoo.", "yandex.", "ecosia.", "baidu.", "brave."];
const SOCIAL = ["t.co", "twitter.", "x.com", "facebook.", "fb.", "instagram.", "t.me", "telegram.", "reddit.", "linkedin.", "whatsapp", "youtube.", "tiktok."];

export function classifyReferrer(ref: string | undefined, host: string): { refType: AnalyticsEvent["refType"]; refDomain?: string } {
  if (!ref) return { refType: "direct" };
  let domain: string;
  try { domain = new URL(ref).hostname.toLowerCase(); } catch { return { refType: "direct" }; }
  if (domain === host || domain.endsWith(`.${host}`)) return { refType: "internal", refDomain: domain };
  if (SEARCH.some((s) => domain.includes(s))) return { refType: "search", refDomain: domain };
  if (SOCIAL.some((s) => domain.includes(s))) return { refType: "social", refDomain: domain };
  return { refType: "referral", refDomain: domain };
}

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|vkshare|w3c_validator|headless|lighthouse|monitor|curl|wget|python-requests|axios|node-fetch/i;

export function parseUserAgent(ua: string): { device: AnalyticsEvent["device"]; os: string; browser: string; bot: boolean } {
  if (!ua || BOT_RE.test(ua)) return { device: "bot", os: "-", browser: "-", bot: true };
  const isTablet = /ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua));
  const isMobile = /iphone|ipod|android.*mobile|windows phone|mobile/i.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
  const os = /windows nt/i.test(ua) ? "Windows"
    : /iphone|ipad|ipod/i.test(ua) ? "iOS"
    : /mac os x/i.test(ua) ? "macOS"
    : /android/i.test(ua) ? "Android"
    : /linux/i.test(ua) ? "Linux" : "Other";
  const browser = /edg\//i.test(ua) ? "Edge"
    : /opr\/|opera/i.test(ua) ? "Opera"
    : /chrome|crios/i.test(ua) ? "Chrome"
    : /firefox|fxios/i.test(ua) ? "Firefox"
    : /safari/i.test(ua) ? "Safari" : "Other";
  return { device, os, browser, bot: false };
}

const SALT = process.env.ANALYTICS_SALT || process.env.ADMIN_SESSION_SECRET || "ilsp-analytics-salt";

export function dailyVisitorId(ip: string, ua: string, day: string): string {
  return createHash("sha256").update(`${SALT}|${day}|${ip}|${ua}`).digest("hex").slice(0, 16);
}

export async function recordEvent(evt: AnalyticsEvent): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await appendFile(path.join(DIR, `events-${evt.day}.jsonl`), JSON.stringify(evt) + "\n", "utf8");
}

export async function readEvents(days = 14): Promise<AnalyticsEvent[]> {
  let files: string[] = [];
  try { files = (await readdir(DIR)).filter((f) => f.startsWith("events-") && f.endsWith(".jsonl")).sort().slice(-days); }
  catch { return []; }
  const all: AnalyticsEvent[] = [];
  for (const f of files) {
    try {
      const raw = await readFile(path.join(DIR, f), "utf8");
      for (const line of raw.split("\n")) {
        if (!line.trim()) continue;
        try { all.push(JSON.parse(line)); } catch { /* skip malformed line */ }
      }
    } catch { /* skip unreadable file */ }
  }
  return all;
}
