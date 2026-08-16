// FINAL feed-heal — the last write to data/articles.json in a cycle, AFTER every
// other step (drafting, guards, cleanup-backlog). It guarantees the feed handed to
// the quality gate always satisfies the content-integrity uniqueness rules, so a
// dedup that any earlier step missed (or a self-push union-merge reintroduced) can
// never hard-fail the gate and trigger a "Run failed" email. It only DEMOTES to
// review (nothing is deleted) and strips duplicate image entries.
import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { titleSimilarity } from "./newsroom-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = async (rel, fb) => { try { return JSON.parse(await readFile(path.join(root, rel), "utf8")); } catch { return fb; } };

export async function healFeed() {
  const doc = await read("data/articles.json", []);
  const list = Array.isArray(doc) ? doc : (doc.articles ?? []);
  const media = await read("data/article-media.json", {});
  const wc = (a) => (a.body ?? []).join(" ").split(/\s+/).filter(Boolean).length;
  const isLive = (a) => (a.status ?? "published") !== "review";
  let demoted = 0, stripped = 0;
  const demote = (a, why) => { if (isLive(a)) { a.status = "review"; a.reviewReasons = [why]; demoted += 1; } };

  // 1) Unique id / slug / dedupeKey among published — keep the fuller story.
  for (const field of ["id", "slug", "dedupeKey"]) {
    const seen = new Map();
    for (const a of list.filter(isLive)) {
      const v = a[field]; if (!v) continue;
      const prev = seen.get(v);
      if (!prev) { seen.set(v, a); continue; }
      const loser = wc(prev) >= wc(a) ? a : prev;
      const keep = loser === a ? prev : a;
      demote(loser, `duplicate ${field} of /article/${keep.slug}`);
      seen.set(v, keep);
    }
  }
  // 2) No near-duplicate headlines (>=0.72) — the same threshold the gate enforces.
  const live = list.filter(isLive);
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      if (!isLive(live[i]) || !isLive(live[j])) continue;
      if (titleSimilarity(live[i].title, live[j].title) < 0.72) continue;
      const loser = wc(live[i]) >= wc(live[j]) ? live[j] : live[i];
      const keep = loser === live[i] ? live[j] : live[i];
      demote(loser, `near-duplicate headline of /article/${keep.slug}`);
    }
  }
  // 3a) Strip any image whose OWN caption/alt admits it does not depict the subject —
  //    the content gate hard-fails on it. This used to live in the image-sourcing step,
  //    but that step is skipped when sourceImages is off, so heal-feed owns it now.
  const MISMATCH = /does not depict|not shown|not represented as visible|illustrating.*not identified|generic image|image mismatch|does not show/i;
  for (const a of list.filter(isLive)) {
    const m = media[a.id];
    if (m && MISMATCH.test(`${m.caption ?? ""} ${m.alt ?? ""}`)) { delete media[a.id]; stripped += 1; }
  }
  // 3a2) Strip a photo whose caption is of a CLEARLY DIFFERENT SPORT than the story
  //    (e.g. a table-tennis photo under an athletics report, a handball photo under a
  //    football story). Venue/stadium file photos are allowed and kept. This is the
  //    exact class that embarrassingly reached X, so it is stripped every cycle.
  const VENUE = /stadium|arena|\bhall\b|stade|estadio|complex|rink|\bpark\b|אצטדיון|хал|היצי|כניס/i;
  const SPORTS = ["table tennis", "handball", "cricket", "rugby", "baseball", "ice hockey", "field hockey",
    "water polo", "volleyball", "gymnastics", "judo", "wrestling", "boxing", "swimming", "athletics",
    "cycling", "tennis", "basketball", "football", "soccer"];
  const sportOf = (text) => {
    const s = text.toLowerCase();
    if (/steeplechase|100m|200m|400m|800m|1500|3000|5000|10000|marathon|sprint|hurdles|long jump|high jump|discus|javelin|heptathlon|decathlon/.test(s)) return "athletics";
    if (/backstroke|freestyle|butterfly|medley|\bIM\b|breaststroke|\bpool\b/i.test(text)) return "swimming";
    for (const sp of SPORTS) { if (s.includes(sp)) return sp === "football" ? "soccer" : sp; }
    return null;
  };
  for (const a of list.filter(isLive)) {
    const m = media[a.id];
    if (!m || m.fallback) continue;
    const cap = `${m.caption ?? ""} ${(m.creditUrl || "").split("File:").pop() || ""}`.replace(/_/g, " ");
    if (VENUE.test(cap)) continue;
    const artSport = sportOf(`${a.title ?? ""} ${a.category ?? ""}`);
    const imgSport = sportOf(cap);
    if (artSport && imgSport && artSport !== imgSport) { delete media[a.id]; stripped += 1; }
  }
  // 3a3) Strip any image whose file is MISSING on disk — the gate does an fs.access on
  //    every curated image, so a media entry whose download failed hard-fails it in CI.
  for (const a of list.filter(isLive)) {
    const m = media[a.id];
    if (!m?.src) continue;
    try { await access(path.join(root, "public", m.src.replace(/^\//, ""))); }
    catch { delete media[a.id]; stripped += 1; }
  }
  // 3b) Unique non-fallback story images (src AND creditUrl) — strip the duplicate
  //    entry so that story falls back to its category visual.
  const seenSrc = new Set(), seenUrl = new Set();
  for (const a of list.filter(isLive)) {
    const m = media[a.id];
    if (!m?.src || !m?.creditUrl || m.fallback) continue;
    if (seenSrc.has(m.src) || seenUrl.has(m.creditUrl)) { delete media[a.id]; stripped += 1; }
    else { seenSrc.add(m.src); seenUrl.add(m.creditUrl); }
  }

  if (demoted || stripped) {
    if (Array.isArray(doc)) await writeFile(path.join(root, "data/articles.json"), `${JSON.stringify(list, null, 2)}\n`);
    else await writeFile(path.join(root, "data/articles.json"), `${JSON.stringify(doc, null, 2)}\n`);
    if (stripped) await writeFile(path.join(root, "data/article-media.json"), `${JSON.stringify(media, null, 2)}\n`);
  }

  // 4) Prune stale / orphaned translations. The localization gate requires every stored
  //    translation to point to a PUBLISHED article at its CURRENT version. A re-drafted
  //    article gets a new updatedAt, leaving its FR/ES translation stale -> the gate
  //    fails on EVERY run (even skipped ones, since the tests read committed data) until
  //    the translator catches up. Drop stale/orphaned ones here; they regenerate later.
  let prunedT = 0;
  try {
    const trans = await read("data/content-translations.json", { translations: [] });
    if (Array.isArray(trans.translations)) {
      const byId = new Map(list.map((a) => [a.id, a]));
      const before = trans.translations.length;
      trans.translations = trans.translations.filter((t) => {
        const a = byId.get(t.articleId);
        if (!a || (a.status ?? "published") === "review") return false;
        if (t.sourceUpdatedAt && t.sourceUpdatedAt !== (a.updatedAt ?? a.publishedAt)) return false;
        return true;
      });
      prunedT = before - trans.translations.length;
      if (prunedT) await writeFile(path.join(root, "data/content-translations.json"), `${JSON.stringify(trans, null, 2)}\n`);
    }
  } catch { /* non-fatal */ }

  // 5) Quiz-package integrity — the gate needs a PUBLISHED "From the Archive" with >=2
  //    verification sources for data/daily-quiz.json's date. If demotions/holds broke
  //    the pair, re-point the quiz to the newest date that still has a valid archive.
  let quizFixed = false;
  try {
    const quiz = await read("data/daily-quiz.json", null);
    if (quiz?.date) {
      const goodArchive = (d) => list.some((a) => (a.status ?? "published") !== "review"
        && a.category === "From the Archive" && (a.publishedAt || "").startsWith(d)
        && (a.verificationSources?.length ?? 0) >= 2);
      if (!goodArchive(quiz.date)) {
        const dates = [...new Set(list
          .filter((a) => (a.status ?? "published") !== "review" && a.category === "From the Archive"
            && (a.verificationSources?.length ?? 0) >= 2)
          .map((a) => (a.publishedAt || "").slice(0, 10)))].sort().reverse();
        if (dates[0]) {
          quiz.date = dates[0];
          await writeFile(path.join(root, "data/daily-quiz.json"), `${JSON.stringify(quiz, null, 2)}\n`);
          quizFixed = true;
        }
      }
    }
  } catch { /* non-fatal */ }

  console.log(`[heal-feed] demoted ${demoted} duplicate; stripped ${stripped} image(s); pruned ${prunedT} translation(s); quiz repaired: ${quizFixed}.`);
  return { demoted, stripped, prunedT, quizFixed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  healFeed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
