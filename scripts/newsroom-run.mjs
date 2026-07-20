// ILSP autonomous newsroom runner (cloud).
// Discovers Israeli-sport candidates, then for each one asks Claude to draft +
// fact-check a full article against the hard gates, using web search. Only
// stories that pass the gates are published; anything uncertain is held as
// "review". The workflow runs audit + tests afterwards, so a malformed cycle is
// never committed. Designed to be conservative: when in doubt, hold.

import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Anthropic from "@anthropic-ai/sdk";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const MAX_CANDIDATES = Math.max(1, Number(process.env.NEWSROOM_MAX_CANDIDATES ?? 6));
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  // Skip quietly (exit 0) so scheduled runs before the key is configured don't
  // spam failure notifications. Set ANTHROPIC_API_KEY to activate the newsroom.
  console.log("ANTHROPIC_API_KEY is not set — skipping this cycle (newsroom not yet activated).");
  process.exit(0);
}

const client = new Anthropic({ apiKey });

const readJson = async (rel) => JSON.parse(await readFile(path.join(root, rel), "utf8"));
const writeJson = async (rel, value) =>
  writeFile(path.join(root, rel), JSON.stringify(value, null, 2) + "\n", "utf8");

const norm = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// The exact article contract the site expects (kept in sync with data/articles.json).
const ARTICLE_SCHEMA = {
  type: "object",
  required: [
    "id", "slug", "title", "dek", "category", "desk", "kind", "storyForm",
    "publishedAt", "updatedAt", "readMinutes", "source", "verificationSources",
    "body", "facts", "theme", "homepagePriority", "homepageReason", "dedupeKey",
    "aiDisclosure", "confidence", "warning", "commonsQuery", "commonsCandidates",
  ],
  properties: {
    id: { type: "string" },
    slug: { type: "string" },
    title: { type: "string" },
    dek: { type: "string" },
    category: { type: "string" },
    desk: { type: "string", enum: ["israel", "international"] },
    kind: { type: "string" },
    storyForm: { type: "string" },
    publishedAt: { type: "string" },
    updatedAt: { type: "string" },
    readMinutes: { type: "number" },
    source: {
      type: "object",
      required: ["name", "url"],
      properties: {
        name: { type: "string" }, url: { type: "string" },
        originalTitle: { type: "string" }, author: { type: "string" },
      },
    },
    verificationSources: {
      type: "array",
      items: { type: "object", required: ["label", "url"], properties: { label: { type: "string" }, url: { type: "string" } } },
    },
    body: { type: "array", items: { type: "string" }, minItems: 7, maxItems: 8 },
    facts: { type: "array", items: { type: "string" }, minItems: 5 },
    theme: { type: "string" },
    homepagePriority: { type: "number" },
    homepageReason: { type: "string" },
    dedupeKey: { type: "string" },
    aiDisclosure: { type: "string" },
    nameChecks: {
      type: "array",
      items: { type: "object", properties: { hebrew: { type: "string" }, english: { type: "string" }, verificationUrl: { type: "string" }, confidence: { type: "number" } } },
    },
    confidence: { type: "number" },
    warning: { type: "string" },
    commonsQuery: { type: "string" },
    commonsCandidates: {
      type: "array",
      items: { type: "object", properties: { title: { type: "string" }, creditUrl: { type: "string" }, credit: { type: "string" }, license: { type: "string" } } },
    },
  },
};

const GATES = `HARD EDITORIAL GATES — obey exactly:
- Never invent facts, quotes, results, names or numbers. If you cannot verify something from the source, omit it.
- Verify every material fact against at least TWO independent, named sources; list them all in verificationSources.
- A final score is publishable ONLY if at least two independent outlets explicitly report the match as full-time, and the goal events sum exactly to the score. Otherwise report it as in-progress or hold (set confidence below 0.92 and explain in warning).
- Verify every person/team name transliteration against an official/registry record (Transfermarkt / Wikipedia / league / World Athletics) and record it in nameChecks.
- The story must be genuinely Israeli-related (Israeli competition or an Israeli athlete/team). If it is international with only a thin Israeli angle, use desk "international"; if there is no Israeli relevance at all, set confidence 0 and warning "no Israeli angle".
- No publisher names in title or dek; at most once in the body; never on the international desk.
- body must be professional broadsheet English, EXACTLY 7 paragraphs.
- Set confidence (0-1) honestly. Set warning to "" only if every core fact is multi-source consistent and nothing is uncertain.
- Propose commonsQuery + up to 3 REAL Wikimedia Commons files (verify they exist) for a relevant, correctly-identified photo.`;

async function draftAndVerify(candidate, todayIso) {
  const prompt = `You are the copy desk for Israel Sports Pulse (English-language Israeli sports newsroom).
Draft ONE article from this source: ${candidate.url}
(reported title: ${candidate.title ?? "unknown"})

Use web search to read the source and to verify every fact against independent sources.
${GATES}

Fixed fields: publishedAt/updatedAt = "${todayIso}", theme = "night-pitch", pick a sensible category (e.g. "Israeli Football", "Israeli Basketball", "Israelis Abroad", "Israeli Olympic Sport", "World Football") and desk. Make id start with "live-" + date + a short slug, and a descriptive kebab slug with no publisher names.

Return the article by calling the tool "emit_article" with the full object. Do not write anything else.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 8 },
      { name: "emit_article", description: "Emit the finished, fact-checked article.", input_schema: ARTICLE_SCHEMA },
    ],
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use" && c.name === "emit_article");
  return toolUse ? toolUse.input : null;
}

function passesGates(article) {
  if (!article) return false;
  if (typeof article.confidence !== "number" || article.confidence < 0.92) return false;
  if (article.warning && article.warning.trim() !== "") return false;
  if (!Array.isArray(article.body) || article.body.length < 7) return false;
  const names = article.nameChecks ?? [];
  if (names.some((n) => typeof n.confidence === "number" && n.confidence < 0.9)) return false;
  return true;
}

async function main() {
  console.log(`Newsroom runner starting — model=${MODEL}, max=${MAX_CANDIDATES}`);

  // 1. Discovery (writes candidates into data/ingestion-report.json).
  try {
    execSync("npm run ingest:dry", { cwd: root, stdio: "inherit" });
  } catch {
    console.warn("Discovery step reported a non-zero exit; continuing with whatever candidates exist.");
  }

  const report = await readJson("data/ingestion-report.json").catch(() => ({ candidates: [] }));
  const candidates = (report.candidates ?? []).slice(0, MAX_CANDIDATES);
  if (!candidates.length) {
    console.log("No candidates this cycle.");
    return;
  }

  const data = await readJson("data/articles.json");
  const articles = Array.isArray(data) ? data : data.articles;
  const seen = new Set(articles.flatMap((a) => [norm(a.id), norm(a.slug), norm(a.dedupeKey)]));

  const todayIso = new Date().toISOString();
  let published = 0;
  let review = 0;

  for (const candidate of candidates) {
    let article;
    try {
      article = await draftAndVerify(candidate, todayIso);
    } catch (error) {
      console.warn(`Draft failed for ${candidate.url}: ${error.message}`);
      continue;
    }
    if (!article || !article.id || !article.slug) continue;
    if (seen.has(norm(article.id)) || seen.has(norm(article.slug)) || (article.dedupeKey && seen.has(norm(article.dedupeKey)))) {
      console.log(`Skip duplicate: ${article.slug}`);
      continue;
    }
    // Media, structured recaps and full media QA are handled by the media step /
    // human desk; for now anything that would publish without vetted media is held.
    const gated = passesGates(article);
    article.status = gated ? "review" : "review"; // v1: always land in review until media + vision QA runs.
    if (!article.warning) article.warning = "";

    // Strip runner-only fields we don't persist verbatim if empty.
    if (!article.nameChecks) article.nameChecks = [];

    articles.unshift(article);
    seen.add(norm(article.id));
    seen.add(norm(article.slug));
    if (article.dedupeKey) seen.add(norm(article.dedupeKey));
    if (gated) published += 1; else review += 1;
    console.log(`Drafted ${article.slug} — confidence ${article.confidence}, gate ${gated ? "PASS" : "HOLD"} -> review`);
  }

  if (Array.isArray(data)) {
    await writeJson("data/articles.json", articles);
  } else {
    data.articles = articles;
    await writeJson("data/articles.json", data);
  }

  console.log(`Cycle done — ${published} gate-pass, ${review} held; all staged as review pending media + final QA.`);
}

await main();
