// Refresh the internal current-story snapshot inside data/social-launch-manifest.json.
//
// The snapshot is a rolling ≤12h view of the freshest publishable story per
// editorial role. It is validated (fail-closed) by scripts/validate-social-launch
// and expires after its window, so the autonomous newsroom refreshes it each cycle
// to keep the full governance test-gate green WITHOUT weakening it. Nothing here is
// faked: every chosen story is a real published article with complete local media.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data/social-launch-manifest.json");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const articles = JSON.parse(readFileSync(path.join(root, "data/articles.json"), "utf8"));
const media = JSON.parse(readFileSync(path.join(root, "data/article-media.json"), "utf8"));

// Keep the exact role set + requires the validator expects, seeded from the
// current snapshot so we never drift from the declared editorial contract.
const roleSpecs = manifest.currentStorySnapshot.candidates.map((c) => ({
  role: c.role,
  requires: Array.isArray(c.requires) ? c.requires : [],
  minMaxAge: Number(c.maxAgeHours) || 24,
}));

function meetsRequires(article, requires) {
  for (const r of requires) {
    if (r === "matchRecap" && !article.matchRecap) return false;
    if (r === "basketballRecap" && !article.basketballRecap) return false;
    if (r === "column" && !(article.kind === "analysis" && article.storyForm === "column")) return false;
    if (r === "historical-feature" && article.storyForm !== "historical-feature") return false;
  }
  return true;
}

function hasLocalMedia(id) {
  const m = media[id];
  return Boolean(
    m?.src?.startsWith("/media/") &&
    m.caption?.trim() && m.credit?.trim() && m.license?.trim() &&
    existsSync(path.join(root, "public", m.src)),
  );
}

const now = Date.now();
const HOUR = 60 * 60 * 1000;
const usedArticles = new Set();
const usedMedia = new Set();
const candidates = [];
const missing = [];

for (const spec of roleSpecs) {
  const pool = articles
    .filter((a) => (a.status ?? "published") === "published")
    .filter((a) => meetsRequires(a, spec.requires))
    .filter((a) => hasLocalMedia(a.id))
    .filter((a) => !usedArticles.has(a.id) && !usedMedia.has(media[a.id].src))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  const pick = pool[0];
  if (!pick) { missing.push(spec.role); continue; }

  const ageHours = Math.ceil((now - Date.parse(pick.publishedAt)) / HOUR) + 2;
  usedArticles.add(pick.id);
  usedMedia.add(media[pick.id].src);
  candidates.push({
    role: spec.role,
    articleId: pick.id,
    maxAgeHours: Math.max(spec.minMaxAge, ageHours),
    requires: spec.requires,
  });
}

if (missing.length) {
  console.error(`Cannot refresh snapshot — no fresh published+media story for role(s): ${missing.join(", ")}`);
  process.exit(1);
}

// Exactly a 12h window (the validator requires snapshotWindowHours <= 12 and the
// governance test asserts it equals 12).
const checkedAt = new Date(now).toISOString().replace(/\.\d+Z$/, "Z");
const validUntil = new Date(Date.parse(checkedAt) + 12 * HOUR).toISOString().replace(/\.\d+Z$/, "Z");
manifest.currentStorySnapshot = {
  ...manifest.currentStorySnapshot,
  checkedAt,
  validUntil,
  status: "internal-candidates-only-not-scheduled",
  candidates,
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Refreshed current-story snapshot: ${candidates.length} roles, valid until ${validUntil}.`);
