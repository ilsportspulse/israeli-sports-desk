#!/usr/bin/env node
// Daily recurring features for Israel Sports Pulse, each generated ONCE per day
// and self-gated so the every-30-minutes newsroom cycle only produces them once:
//   1. A fresh Daily Five quiz (questions drawn from OUR already-verified published
//      articles, so every fact is grounded — never invented).
//   2. One Retro historical feature (a real, verifiable moment in Israeli sport).
//   3. One ILSP Column (analysis + a grounded, realistic opinion built on real,
//      researched facts — opinions are the columnist's, the facts are verified).
//
// Dual auth like the newsroom: Claude Code CLI (logged-in Max token) or API key.
// Every step is wrapped so a failure NEVER breaks the newsroom run.
//
//   node scripts/daily-features.mjs            # ensure today's quiz + retro + column
//   DAILY_ONLY=quiz node scripts/daily-features.mjs
// Or import { runDailyFeatures } and call it from the newsroom runner.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTICLES = path.join(root, "data", "articles.json");
const QUIZ = path.join(root, "data", "daily-quiz.json");

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const TIMEOUT_MS = Number(process.env.DAILY_TIMEOUT_MS ?? String(6 * 60 * 1000));
const apiKey = process.env.ANTHROPIC_API_KEY;
const MODE = process.env.DAILY_MODE ?? (apiKey && !process.env.CLAUDE_CODE_OAUTH_TOKEN ? "api" : "cli");

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n"); }
function todayIso(now) { return now.toISOString().slice(0, 10); }

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [];
  if (fenced) candidates.push(fenced[1]);
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
  candidates.push(text);
  for (const raw of candidates) {
    try { return JSON.parse(raw.trim()); } catch { /* next */ }
  }
  return null;
}

// CLI drives Claude Code headlessly; allow web tools so Retro/Column can research.
function callCli(prompt, { web = false } = {}) {
  const args = ["-p", prompt, "--output-format", "json", "--model", MODEL, "--permission-mode", "default"];
  if (web) args.push("--allowedTools", "WebSearch,WebFetch");
  const out = execFileSync("claude", args, { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: TIMEOUT_MS, env: { ...process.env } });
  let text = out;
  try { const env = JSON.parse(out); text = env.result ?? env.text ?? out; } catch { /* raw */ }
  return extractJson(text);
}
async function callApi(prompt, schema, name, { web = false } = {}) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  const tools = [{ name, description: `Emit the ${name}.`, input_schema: schema }];
  if (web) tools.unshift({ type: "web_search_20250305", name: "web_search", max_uses: 8 });
  const response = await client.messages.create({
    model: MODEL, max_tokens: 8000, tools,
    tool_choice: web ? { type: "auto" } : { type: "tool", name },
    messages: [{ role: "user", content: prompt }],
  });
  const use = response.content.find((c) => c.type === "tool_use" && c.name === name);
  return use ? use.input : null;
}

const GATE = `HARD RULES: never invent facts, quotes, results, names, numbers or sources. Verify every material fact against at least two independent, named sources. Keep every Israeli/foreign name transliteration correct. If you cannot verify something, omit it. Do NOT publish the founder's name or biography anywhere.

IMAGE (MANDATORY): research an accurate photo for THIS exact story and return commonsQuery plus commonsCandidates — 2 to 4 REAL Wikimedia Commons files, ranked most-relevant first. For EACH, via web search on commons.wikimedia.org: confirm the file exists and is a JPEG photograph (not a logo/flag/map/diagram/artwork), confirm a reusable licence (CC BY, CC BY-SA, CC0 or public domain), and CONFIRM IT DEPICTS THE RIGHT SUBJECT — the exact person, club, venue or competition in the story (beware namesakes and wrong context; check the file's description/categories). Priority: the named athlete → their club/team → the exact venue → the competition/trophy. If you cannot verify at least one correctly-identified image, return commonsCandidates as [] and say so in warning — the story is held rather than shown with a wrong photo. Never invent or guess a file name.`;

// ---------- 1. Daily quiz (grounded in our own verified articles) ----------
async function ensureQuiz(articles, now) {
  const today = todayIso(now);
  const existing = readJson(QUIZ, null);
  if (existing && existing.date === today) return { skipped: "quiz already today" };

  const recent = [...articles]
    .filter((a) => a.status !== "review")
    .sort((x, y) => new Date(y.updatedAt ?? y.publishedAt) - new Date(x.updatedAt ?? x.publishedAt))
    .slice(0, 14)
    .map((a) => ({ title: a.title, facts: (a.facts ?? []).slice(0, 6), source: a.source?.url ?? "" }));

  const prompt = `${GATE}

You are the ILSP quiz editor. Build today's "Daily Five" — exactly 5 multiple-choice questions — using ONLY the facts in these recently published, already-verified Israel Sports Pulse articles. Every question, every answer option and the correct answer MUST be supported by the supplied facts; do not introduce outside claims.

Rules: 4 answer options per question; exactly one correct (correctIndex 0-3); a one-sentence explanation; a real sourceUrl taken from the article the question is based on. Mix football, basketball, Olympic sport and Israelis abroad where the material allows. Fun but accurate.

Recent verified articles (JSON):
${JSON.stringify(recent, null, 2)}

Return ONLY JSON: {"date":"${today}","title":"The Daily Five","dek":"<one sentence>","questions":[{"question","answers":[4],"correctIndex","explanation","sourceUrl"} x5]}`;

  const schema = {
    type: "object", required: ["date", "title", "dek", "questions"],
    properties: {
      date: { type: "string" }, title: { type: "string" }, dek: { type: "string" },
      questions: { type: "array", minItems: 5, maxItems: 5, items: {
        type: "object", required: ["question", "answers", "correctIndex", "explanation", "sourceUrl"],
        properties: { question: { type: "string" }, answers: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } }, correctIndex: { type: "number" }, explanation: { type: "string" }, sourceUrl: { type: "string" } },
      } },
    },
  };

  const quiz = MODE === "cli" ? callCli(prompt) : await callApi(prompt, schema, "emit_quiz");
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length !== 5) return { failed: "invalid quiz" };
  if (quiz.questions.some((q) => !Array.isArray(q.answers) || q.answers.length !== 4 || typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3 || !q.question?.trim())) return { failed: "invalid question" };
  quiz.date = today;
  writeJson(QUIZ, quiz);
  return { wrote: "quiz" };
}

// ---------- shared: generate one article via the model ----------
async function generateArticle(kind, prompt, now) {
  const schema = {
    type: "object",
    required: ["title", "dek", "category", "body", "facts"],
    properties: {
      title: { type: "string" }, dek: { type: "string" }, category: { type: "string" },
      body: { type: "array", minItems: 5, maxItems: 18, items: { type: "string" } },
      facts: { type: "array", minItems: 5, items: { type: "string" } },
      verificationSources: { type: "array", items: { type: "object", properties: { label: { type: "string" }, url: { type: "string" } } } },
      confidence: { type: "number" }, warning: { type: "string" },
      archiveDate: { type: "string" }, archiveDisplay: { type: "object" },
      source: { type: "object", properties: { name: { type: "string" }, url: { type: "string" } } },
      commonsQuery: { type: "string" },
      commonsCandidates: { type: "array", items: { type: "object", properties: { title: { type: "string" }, creditUrl: { type: "string" }, credit: { type: "string" }, license: { type: "string" } } } },
    },
  };
  const art = MODE === "cli" ? callCli(prompt, { web: true }) : await callApi(prompt, schema, "emit_article", { web: true });
  if (!art) return null;
  // Gate: real, verified, complete.
  if (!art.title?.trim() || !Array.isArray(art.body) || art.body.length < 5 || !Array.isArray(art.facts) || art.facts.length < 5) return null;
  if (typeof art.confidence === "number" && art.confidence < 0.9) return null;
  if (art.warning && String(art.warning).trim() !== "") return null;
  // The editorial audit demotes any story without a specific (non-homepage)
  // verification URL, so require at least one before we ever create the article.
  const hasSpecificSource = Array.isArray(art.verificationSources) && art.verificationSources.some((s) => {
    try { const u = new URL(s.url); return u.search.length > 1 || u.pathname.split("/").filter(Boolean).length >= 2; } catch { return false; }
  });
  if (!hasSpecificSource) return null;
  return art;
}

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70); }

// ---------- 2. Retro historical feature ----------
async function ensureRetro(articles, now) {
  const today = todayIso(now);
  const hasToday = articles.some((a) => a.category === "From the Archive" && (a.publishedAt ?? "").slice(0, 10) === today);
  if (hasToday) return { skipped: "retro already today" };
  const usedTitles = articles.filter((a) => a.category === "From the Archive").map((a) => a.title).slice(0, 40);

  const prompt = `${GATE}

You are the ILSP History desk. Write ONE "From the Archive" (Retro) feature about a REAL, verifiable moment in Israeli sporting history — a famous match, medal, debut, transfer, record or milestone. Research it properly on the web and confirm every fact against at least two independent sources.

Do NOT reuse any of these already-published subjects: ${JSON.stringify(usedTitles)}.

Warm, vivid, accurate broadsheet English; 6-12 paragraphs. Include archiveDate (the real date of the event, YYYY-MM-DD) and archiveDisplay {home, away, score, dateLine, year} describing it. category MUST be "From the Archive".

Return ONLY JSON with: title, dek, category, body[], facts[>=5], verificationSources[{label,url}], archiveDate, archiveDisplay{home,away,score,dateLine,year}, source{name,url}, confidence(0-1), warning("" if none).`;

  const art = await generateArticle("retro", prompt, now);
  if (!art || !art.archiveDate) return { failed: "retro not verified" };
  const id = `archive-${today.replace(/-/g, "")}-${slugify(art.title).slice(0, 40)}`;
  return {
    article: {
      id, slug: slugify(art.title), title: art.title, dek: art.dek,
      category: "From the Archive", desk: "israel", kind: "explainer", storyForm: "historical-feature",
      publishedAt: now.toISOString(), updatedAt: now.toISOString(), readMinutes: Math.max(3, Math.round(art.body.join(" ").split(/\s+/).length / 200)),
      source: art.source ?? { name: "ILSP History Desk", url: "" }, verificationSources: art.verificationSources ?? [],
      body: art.body, facts: art.facts, theme: "night-pitch", commonsQuery: art.commonsQuery, commonsCandidates: art.commonsCandidates ?? [],
      archiveDate: art.archiveDate, archiveDisplay: art.archiveDisplay ?? { home: "The story", score: "Retro", away: "Revisited", dateLine: art.archiveDate, year: art.archiveDate.slice(0, 4) },
      aiDisclosure: "Researched and written by the ILSP AI history desk; every fact verified against independent sources.",
      status: "published",
    },
  };
}

// ---------- 3. ILSP Column ----------
async function ensureColumn(articles, now) {
  const today = todayIso(now);
  const hasToday = articles.some((a) => a.kind === "analysis" && (a.publishedAt ?? "").slice(0, 10) === today);
  if (hasToday) return { skipped: "column already today" };

  const context = [...articles]
    .filter((a) => a.status !== "review" && a.kind !== "analysis")
    .sort((x, y) => new Date(y.updatedAt ?? y.publishedAt) - new Date(x.updatedAt ?? x.publishedAt))
    .slice(0, 10).map((a) => a.title);

  const prompt = `${GATE}

You are a senior ILSP columnist. Write ONE opinion column with a clear, realistic ARGUMENT about a current Israeli-sport talking point (pick from the day's stories below or a closely related live issue). Research the facts on the web and confirm them.

This is analysis + opinion: the OPINION and judgement are yours and can be strong, but every FACT the argument rests on must be real and verified — never invent a quote, stat or event. Ground the take in specifics (form, tactics, numbers, history). 8-14 paragraphs, sharp broadsheet English, a genuine thesis, no fence-sitting, no filler.

Today's stories for context: ${JSON.stringify(context)}.

Return ONLY JSON with: title, dek, category, body[], facts[>=5], verificationSources[{label,url}], source{name,url}, confidence(0-1), warning("" if none).`;

  const art = await generateArticle("column", prompt, now);
  if (!art) return { failed: "column not verified" };
  const id = `column-${today.replace(/-/g, "")}-${slugify(art.title).slice(0, 40)}`;
  return {
    article: {
      id, slug: slugify(art.title), title: art.title, dek: art.dek,
      category: art.category || "ILSP Column", desk: "israel", kind: "analysis", storyForm: "column",
      publishedAt: now.toISOString(), updatedAt: now.toISOString(), readMinutes: Math.max(4, Math.round(art.body.join(" ").split(/\s+/).length / 200)),
      source: art.source ?? { name: "ILSP Column", url: "" }, verificationSources: art.verificationSources ?? [],
      body: art.body, facts: art.facts, theme: "amber-dusk", commonsQuery: art.commonsQuery, commonsCandidates: art.commonsCandidates ?? [],
      aiDisclosure: "An ILSP AI column: the analysis and opinion are the desk's; every underlying fact is verified against independent sources.",
      status: "published",
    },
  };
}

// ---------- 4. Tour de France daily beat (pure cycling coverage) ----------
async function ensureTour(articles, now) {
  const today = todayIso(now);
  const hasToday = articles.some((a) => a.series === "Tour de France" && (a.publishedAt ?? "").slice(0, 10) === today);
  if (hasToday) return { skipped: "tour already today" };

  const prompt = `${GATE}

You are the ILSP cycling desk covering the Tour de France. IF a Tour de France is actually racing (or resting) TODAY (${today}), write ONE stage report/round-up. Research the real result on the web and confirm every rider, time, gap and jersey against at least two independent sources (official Tour/ASO, a major cycling outlet).

If the Tour de France is NOT currently running on ${today} (between editions, rest situation with nothing to report), set warning to explain and confidence below 0.9 so nothing is published — do NOT invent a stage.

The report must state, only where verified: today's stage number and route, the stage winner and podium, and the current classements — general classification (yellow), points (green), king of the mountains (polka-dot) and best young rider (white) — with real names, teams and time gaps. Add colour and stories from the day. No Israeli angle is required. 6-12 paragraphs, sharp broadsheet English.

Return ONLY JSON with: title, dek, category("Cycling"), body[], facts[>=5], verificationSources[{label,url}], source{name,url}, confidence(0-1), warning("" if a verified stage report, otherwise an explanation).`;

  const art = await generateArticle("tour", prompt, now);
  if (!art) return { failed: "tour not verified / not racing today" };
  const id = `tour-${today.replace(/-/g, "")}-${slugify(art.title).slice(0, 40)}`;
  return {
    article: {
      id, slug: slugify(art.title), title: art.title, dek: art.dek,
      category: "Cycling", desk: "international", kind: "news", storyForm: "match-report",
      series: "Tour de France",
      publishedAt: now.toISOString(), updatedAt: now.toISOString(), readMinutes: Math.max(3, Math.round(art.body.join(" ").split(/\s+/).length / 200)),
      source: art.source ?? { name: "ILSP Cycling Desk", url: "" }, verificationSources: art.verificationSources ?? [],
      body: art.body, facts: art.facts, theme: "golden-hour", commonsQuery: art.commonsQuery, commonsCandidates: art.commonsCandidates ?? [],
      aiDisclosure: "Compiled by the ILSP AI cycling desk; every result and classification verified against official Tour and independent cycling sources.",
      status: "published",
    },
  };
}

export async function runDailyFeatures(nowIso) {
  const now = nowIso ? new Date(nowIso) : new Date();
  const only = process.env.DAILY_ONLY;
  const results = {};
  let articles = readJson(ARTICLES, []);

  if (!only || only === "quiz") {
    try { results.quiz = await ensureQuiz(articles, now); } catch (e) { results.quiz = { error: e.message?.split("\n")[0] }; }
  }
  // Each of retro/column/tour is a slow, research-heavy AI call. Running all three
  // every cycle blew past the 30-minute job window. Instead run AT MOST ONE of them
  // per cycle — the first that isn't done today — so the load spreads across the
  // day's cycles and each cycle stays well inside the timeout. (When DAILY_ONLY is
  // set we run exactly that one, for manual/testing use.)
  const additions = [];
  const slow = [
    ["retro", ensureRetro],
    ["column", ensureColumn],
    ["tour", ensureTour],
  ];
  for (const [key, ensure] of slow) {
    if (only && only !== key) continue;
    try {
      const r = await ensure(articles, now);
      results[key] = r;
      if (r?.article) { additions.push(r.article); break; } // one slow feature per cycle
      if (r?.skipped) continue; // already done today → try the next one
      break; // attempted but produced nothing (held/failed) → stop for this cycle
    } catch (e) {
      results[key] = { error: e.message?.split("\n")[0] };
      break;
    }
  }
  if (additions.length) {
    articles = readJson(ARTICLES, articles); // re-read in case it changed
    writeJson(ARTICLES, [...additions, ...articles]);
  }
  return results;
}

// Direct run
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !apiKey && MODE !== "cli") {
    console.log("No Claude auth — skipping daily features.");
  } else {
    runDailyFeatures().then((r) => console.log("Daily features:", JSON.stringify(r))).catch((e) => { console.error(e); process.exit(1); });
  }
}
