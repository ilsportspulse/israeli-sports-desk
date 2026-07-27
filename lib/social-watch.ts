import { readFileSync } from "node:fs";
import path from "node:path";

import { getPublicArticleSummaries } from "@/lib/articles";

// Social Media Watcher: a deterministic curation over the X signals the iMac
// scanner harvests from our followed sources (data/x-signals.json). Posts are
// shown as attributed quotes linking to the original — never rewritten — and,
// where the newsroom already covered the subject, to our own story.

export type SocialWatchItem = {
  handle: string;
  group: string;
  postedAt: string;
  text: string;
  url: string;
  relatedSlug?: string;
  relatedTitle?: string;
};

const GENERIC = new Set(
  "the and for with from after says said this that will have been more about their against club team match game league season contract deal sign transfer coach player official statement today tonight news breaking here exclusive story report".split(/\s+/),
);

const tokensOf = (text: string) =>
  new Set(
    text
      .split(/[^A-Za-zÀ-ÖØ-öø-ÿ'’]+/)
      .map((w) => w.replace(/[’']s?$/i, "").toLowerCase())
      .filter((w) => w.length >= 4 && !GENERIC.has(w)),
  );

export function getSocialWatchItems(limit = 8): SocialWatchItem[] {
  let signals: Array<Record<string, string>> = [];
  try {
    const doc = JSON.parse(
      readFileSync(path.join(process.cwd(), "data/x-signals.json"), "utf8"),
    );
    signals = Array.isArray(doc.signals) ? doc.signals : [];
  } catch {
    return [];
  }

  const fresh = signals
    .filter((s) => s.text && s.url && s.postedAt)
    .filter((s) => Date.now() - new Date(s.postedAt).getTime() < 48 * 60 * 60 * 1000)
    // Quote-worthy voices first: clubs, federations and insiders speak; media
    // headlines only fill remaining slots.
    .sort((a, b) => {
      const rank = (g?: string) =>
        g === "israeli-clubs" || g === "israeli-basketball-federations" ? 0 : g === "insiders" ? 1 : 2;
      return rank(a.group) - rank(b.group) || +new Date(b.postedAt) - +new Date(a.postedAt);
    });

  const articles = getPublicArticleSummaries()
    .slice(0, 150)
    .map((a) => ({ slug: a.slug, title: a.title, toks: tokensOf(`${a.title} ${a.dek ?? ""}`) }));

  const seenHandles = new Map<string, number>();
  const items: SocialWatchItem[] = [];
  for (const s of fresh) {
    if (items.length >= limit) break;
    // At most two posts per account keeps the wall varied.
    const per = seenHandles.get(s.handle) ?? 0;
    if (per >= 2) continue;
    const toks = tokensOf(s.text);
    let related: { slug: string; title: string } | undefined;
    let best = 0;
    for (const a of articles) {
      let shared = 0;
      for (const t of toks) if (a.toks.has(t)) shared++;
      if (shared > best && shared >= 2) {
        best = shared;
        related = { slug: a.slug, title: a.title };
      }
    }
    items.push({
      handle: s.handle,
      group: s.group ?? "world",
      postedAt: s.postedAt,
      text: s.text.length > 240 ? `${s.text.slice(0, 237)}…` : s.text,
      url: s.url,
      relatedSlug: related?.slug,
      relatedTitle: related?.title,
    });
    seenHandles.set(s.handle, per + 1);
  }
  return items;
}
