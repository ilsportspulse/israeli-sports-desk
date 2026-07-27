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
  photoUrl?: string;
  relatedSlug?: string;
  relatedTitle?: string;
};

// Israeli News Social Watcher: the wall carries ISRAELI voices only — verified
// Israeli outlets (Hebrew and English, all topics, owner's direction 28 Jul),
// clubs, federations and Israeli players. World clubs/stars/competitions stay
// signal-only for the newsroom; this section is the country's pulse.
const DISPLAY_GROUPS = new Set([
  "israeli-media",
  "israeli-clubs",
  "israeli-basketball-federations",
  "israeli-players",
  "israeli-extras",
]);

// ILSP delivers the sport itself — sport-media posts would only duplicate our
// own coverage, so those outlets stay newsroom-signal-only. Club and player
// voices remain: those are primary sources, not competing coverage.
const SPORT_MEDIA_EXCLUDE = new Set(["@one_co_il", "@sport5il", "@sport1_sport2", "@wallasport", "@thesportsrabbi"]);

// Strip link noise for display; the card links to the post itself. X renders
// long links with soft breaks ("https:// sport5.co.il/…"), so the protocol and
// its continuation are removed separately, plus tracking/query fragments.
const cleanText = (raw: string) =>
  raw
    .replace(/https?:\/\/\s*\S+/g, " ")
    .replace(/\S*(?:utm_\w+=|FolderID=|docID=|\.aspx|\.co\.il\/|\.com\/|\.net\/)\S*/g, " ")
    .replace(/(?:^|\s)(?:-->|>|\.\.\.|…)(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // Reporter-attribution tails ("… : @Est_Davis_") are X-internal noise.
    .replace(/[\s:•|–—-]*@\w+\s*$/, "")
    .trim();


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

export function getSocialWatchItems(limit = 36): SocialWatchItem[] {
  let signals: Array<Record<string, string>> = [];
  try {
    const doc = JSON.parse(
      readFileSync(path.join(process.cwd(), "data/x-signals.json"), "utf8"),
    );
    signals = Array.isArray(doc.signals) ? doc.signals : [];
  } catch {
    return [];
  }

  const inWindow = signals
    .filter((s) => s.text && s.url && s.postedAt)
    .filter((s) => Date.now() - new Date(s.postedAt).getTime() < 72 * 60 * 60 * 1000)
    // A link-only or hashtag-only post has nothing to quote.
    .filter((s) => cleanText(s.text).replace(/#[^\s#]+/g, "").trim().length >= 30 || Boolean(s.photoUrl));
  const fresh = inWindow
    .filter((s) => DISPLAY_GROUPS.has(s.group ?? "") && !SPORT_MEDIA_EXCLUDE.has(s.handle.toLowerCase()))
    // A news wall reads newest-first; the per-handle cap below keeps it varied.
    .sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));

  const articles = getPublicArticleSummaries()
    .slice(0, 150)
    .map((a) => ({ slug: a.slug, title: a.title, toks: tokensOf(`${a.title} ${a.dek ?? ""}`) }));

  // Two passes: first capped per account for variety, then — if the pool is
  // still short of the limit — a fill pass that relaxes the cap, so the wall
  // stays full even on days when only a few outlets are loud.
  const seenHandles = new Map<string, number>();
  const seenUrls = new Set<string>();
  const items: SocialWatchItem[] = [];
  const addItem = (s: Record<string, string>) => {
    if (seenUrls.has(s.url)) return;
    seenUrls.add(s.url);
    const toks = tokensOf(s.text);
    let related: { slug: string; title: string } | undefined;
    let best = 0;
    for (const a of articles) {
      let shared = 0;
      toks.forEach((t) => { if (a.toks.has(t)) shared++; });
      if (shared > best && shared >= 2) {
        best = shared;
        related = { slug: a.slug, title: a.title };
      }
    }
    const display = cleanText(s.text);
    items.push({
      handle: s.handle,
      group: s.group ?? "world",
      postedAt: s.postedAt,
      text: display.length > 220 ? `${display.slice(0, 217)}…` : display,
      url: s.url,
      photoUrl: s.photoUrl || undefined,
      relatedSlug: related?.slug,
      relatedTitle: related?.title,
    });
    seenHandles.set(s.handle, (seenHandles.get(s.handle) ?? 0) + 1);
  };

  for (const s of fresh) {
    if (items.length >= limit) break;
    if ((seenHandles.get(s.handle) ?? 0) >= 4) continue;
    addItem(s);
  }
  if (items.length < limit) {
    for (const s of fresh) {
      if (items.length >= limit) break;
      addItem(s);
    }
  }
  return items;
}
