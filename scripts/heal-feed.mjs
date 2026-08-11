// FINAL feed-heal — the last write to data/articles.json in a cycle, AFTER every
// other step (drafting, guards, cleanup-backlog). It guarantees the feed handed to
// the quality gate always satisfies the content-integrity uniqueness rules, so a
// dedup that any earlier step missed (or a self-push union-merge reintroduced) can
// never hard-fail the gate and trigger a "Run failed" email. It only DEMOTES to
// review (nothing is deleted) and strips duplicate image entries.
import { readFile, writeFile } from "node:fs/promises";
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
  // 3) Unique non-fallback story images (src AND creditUrl) — strip the duplicate
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
  console.log(`[heal-feed] demoted ${demoted} duplicate story(ies); stripped ${stripped} duplicate image(s).`);
  return { demoted, stripped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  healFeed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
