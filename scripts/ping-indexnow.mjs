// IndexNow: instantly notify Bing, Yandex and other IndexNow engines that URLs
// are new or updated. Google does not use IndexNow, but this covers the rest and
// is a genuine quick win for a fast-publishing news site.
//
// Usage:
//   node scripts/ping-indexnow.mjs            # ping recent (last 48h) published articles + key pages
//   node scripts/ping-indexnow.mjs --all      # ping every published article + key pages
// The newsroom runner also calls submitIndexNow() after it publishes, so new
// stories are pushed automatically each cycle.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const HOST = "ilsportspulse.com";
const BASE = `https://${HOST}`;
const KEY = process.env.INDEXNOW_KEY ?? "34108bc1b196c2bbeea4c7d61506646a";
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const STATIC_PATHS = ["/", "/stories", "/scores", "/columns", "/partners"];

// Submit a batch of absolute URLs to IndexNow. Silent-safe: never throws.
export async function submitIndexNow(urls) {
  const list = [...new Set(urls)].filter(Boolean).slice(0, 10000);
  if (!list.length) return { ok: true, count: 0 };
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: list }),
    });
    return { ok: res.ok, status: res.status, count: list.length };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), count: list.length };
  }
}

async function main() {
  const all = process.argv.includes("--all");
  const data = JSON.parse(await readFile(path.join(root, "data/articles.json"), "utf8"));
  const articles = (Array.isArray(data) ? data : data.articles).filter((a) => a.status === "published" && !a.seo?.noindex);
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const chosen = all ? articles : articles.filter((a) => Date.parse(a.publishedAt ?? "") >= cutoff);
  const urls = [
    ...STATIC_PATHS.map((p) => `${BASE}${p === "/" ? "" : p}`),
    ...chosen.map((a) => `${BASE}/article/${a.slug}`),
  ];
  const result = await submitIndexNow(urls);
  console.log(JSON.stringify({ submitted: result.count, ok: result.ok, status: result.status ?? result.error }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
