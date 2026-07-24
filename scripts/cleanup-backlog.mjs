// One-off backlog cleanup for the published feed:
//   1. Demote IN-PROGRESS / half-time match reports to "review" (we only want
//      full-time recaps live).
//   2. Demote DUPLICATES of the same event (same dedupeKey, or same-day stories
//      that share ≥2 distinctive proper-noun tokens) — keep the fullest one live.
// Demoted stories are set status:"review" (not deleted), so nothing is lost and
// they can be restored from the backoffice review queue.
//
// Preview:  node scripts/cleanup-backlog.mjs --dry
// Apply:    node scripts/cleanup-backlog.mjs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

const file = path.join(root, "data/articles.json");
const data = JSON.parse(await readFile(file, "utf8"));
const list = Array.isArray(data) ? data : data.articles;
const published = list.filter((a) => (a.status ?? "published") === "published");

const demoted = new Map(); // id -> reason

// --- 1) in-progress / half-time match reports ---------------------------------
// Tight, TITLE-ONLY in-progress signals. Deliberately narrow so a FINISHED result
// that merely mentions half-time ("let halftime lead slip in a 33-31 defeat",
// "beat Croatia 36:31") is never demoted — only games clearly still being played.
const IN_PROGRESS = /through (?:the )?first half|nears? half-?time|approaching half-?time|\bat the break\b|storm(?:s|ing)? to (?:a |an )?[^,]*?\d{1,2}[–-]\d{1,2} lead\b|\d{1,2}[–-]\d{1,2} lead at\b/i;
const FINISHED = /\b(beat|beaten|defeat|defeated|thrash|edge|edged|win|won|lost|loss|draw|drew|held to|sweep|swept|see off|hold on)\b/i;
for (const a of published) {
  const title = a.title ?? "";
  if (IN_PROGRESS.test(title) && !FINISHED.test(title)) demoted.set(a.id, "in-progress/half-time");
}

// --- 2) duplicates ------------------------------------------------------------
const GENERIC = new Set(("the and for with from after before over into out its his her their they them league cup europa conference champions nations world european stage tour season report reports move deal signing preview clash opener rout win draw loss goal goals side club team first second third final semifinal against north south east west united city real inter athletic sporting star young boys football cycling basketball soccer news article").split(/\s+/));
const tokensOf = (a) => new Set(
  `${a.title ?? ""} ${a.dek ?? ""}`
    .split(/[^A-Za-zÀ-ÖØ-öø-ÿ'’]+/)
    .map((w) => w.replace(/[’']s?$/i, "").toLowerCase())
    .filter((w) => w.length >= 4 && !GENERIC.has(w)),
);
const dayOf = (a) => String(a.publishedAt ?? "").slice(0, 10);
const fullness = (a) => (a.facts?.length ?? 0) * 3 + (a.body?.length ?? 0) + (a.confidence ?? 0);

// 2a) exact dedupeKey collisions (always a duplicate)
const byKey = new Map();
for (const a of published) {
  if (demoted.has(a.id)) continue;
  const k = (a.dedupeKey || "").trim().toLowerCase();
  if (!k) continue;
  if (!byKey.has(k)) byKey.set(k, []);
  byKey.get(k).push(a);
}
for (const group of byKey.values()) {
  if (group.length < 2) continue;
  group.sort((x, y) => fullness(y) - fullness(x));
  for (const a of group.slice(1)) demoted.set(a.id, `dup dedupeKey "${a.dedupeKey}"`);
}

// 2b) SAME-MATCH recaps only: stories whose title carries a score (e.g. 5-0) and
// that, on the same day, share ≥3 distinctive tokens (the two clubs + more) are
// reports of the SAME finished match — keep the fullest, demote the rest. Limiting
// to score-bearing recaps means transfers, previews and separate club news are
// never touched (they don't carry a scoreline).
const hasScore = (a) => /\b\d{1,2}[–-]\d{1,2}\b/.test(a.title ?? "");
const recaps = published.filter((a) => !demoted.has(a.id) && hasScore(a));
const byDay = new Map();
for (const a of recaps) { const d = dayOf(a); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(a); }
for (const group of byDay.values()) {
  const toks = new Map(group.map((a) => [a.id, tokensOf(a)]));
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const a = group[i], b = group[j];
      if (demoted.has(a.id) || demoted.has(b.id)) continue;
      const A = toks.get(a.id), B = toks.get(b.id);
      let shared = 0;
      for (const t of A) if (B.has(t)) shared++;
      if (shared >= 3) {
        const loser = fullness(a) >= fullness(b) ? b : a;
        demoted.set(loser.id, `dup same-match recap (${shared} shared tokens)`);
      }
    }
  }
}

// --- apply --------------------------------------------------------------------
const rows = [];
for (const a of list) {
  if (demoted.has(a.id)) {
    rows.push({ title: a.title, reason: demoted.get(a.id) });
    if (!DRY) {
      a.status = "review";
      a.warning = a.warning || demoted.get(a.id);
    }
  }
}

console.log(`${DRY ? "Would demote" : "Demoted"} ${rows.length} of ${published.length} published stories:`);
for (const r of rows) console.log(`  - [${r.reason}] ${r.title}`);
if (!DRY) {
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("Saved data/articles.json.");
}
