#!/usr/bin/env node
// Translate published English articles into the site's other public locales
// (fr, es) and write the results to data/content-translations.json.
//
// English is the canonical source. Each translation pins the source version
// (updatedAt ?? publishedAt); when the English article changes, the stale
// translation is dropped by the resolver and regenerated on the next run.
//
// Dual auth, matching the newsroom runner:
//   1. CLI mode  — Claude Code + a Max/Pro subscription token (CLAUDE_CODE_OAUTH_TOKEN)
//   2. API mode  — a pay-per-use Anthropic API key (ANTHROPIC_API_KEY)
//
// Usage:
//   node scripts/translate-articles.mjs            # translate everything missing/stale
//   TRANSLATE_MAX=10 node scripts/translate-articles.mjs   # bounded backfill batch
//   TRANSLATE_LOCALES=fr node scripts/translate-articles.mjs  # one locale only

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTICLES = path.join(root, "data", "articles.json");
const TRANSLATIONS = path.join(root, "data", "content-translations.json");

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const MAX = Number(process.env.TRANSLATE_MAX ?? "0"); // 0 = no cap
const LOCALES = (process.env.TRANSLATE_LOCALES ?? "fr,es").split(",").map((s) => s.trim()).filter(Boolean);
const TIMEOUT_MS = Number(process.env.TRANSLATE_TIMEOUT_MS ?? String(6 * 60 * 1000));

const LOCALE_NAMES = { fr: "French (français)", es: "Spanish (español)" };

// CLI mode reuses the machine's logged-in Claude session (no env token needed);
// API mode needs a key. Default to CLI unless only an API key is present.
const apiKey = process.env.ANTHROPIC_API_KEY;
const MODE = process.env.TRANSLATE_MODE ?? (apiKey && !process.env.CLAUDE_CODE_OAUTH_TOKEN ? "api" : "cli");

let client = null;
if (MODE === "api") {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  client = new Anthropic({ apiKey });
}

const TRANSLATION_SCHEMA = {
  type: "object",
  required: ["title", "dek", "category", "body", "facts", "media"],
  properties: {
    title: { type: "string" },
    dek: { type: "string" },
    category: { type: "string" },
    body: { type: "array", items: { type: "string" }, minItems: 5 },
    facts: { type: "array", items: { type: "string" }, minItems: 4 },
    media: {
      type: "object",
      required: ["alt", "caption"],
      properties: { alt: { type: "string" }, caption: { type: "string" } },
    },
  },
};

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function articleImageCopy(article) {
  return {
    alt: article.image?.alt ?? article.title,
    caption: article.image?.caption ?? article.dek,
  };
}

function buildPrompt(article, locale) {
  const media = articleImageCopy(article);
  const source = {
    title: article.title,
    dek: article.dek,
    category: article.category,
    body: article.body,
    facts: article.facts,
    media,
  };
  return `You are a senior sports-desk translator for Israel Sports Pulse. Translate the following English article into ${LOCALE_NAMES[locale] ?? locale} to a professional, publishable journalistic standard.

Rules:
- Journalistic register — natural, idiomatic ${LOCALE_NAMES[locale] ?? locale} as a native sports journalist would write, NOT a literal calque.
- Use the correct, established football/basketball/athletics vocabulary in the target language (e.g. FR: "coup franc", "hors-jeu", "prolongation", "tirs au but"; ES: "tiro libre", "fuera de juego", "prórroga", "penaltis"). Never invent terms.
- Keep every proper noun exactly as written: player names, team names, competition names, cities. Do NOT translate or transliterate names.
- Keep every number, score, date and statistic identical.
- Preserve the paragraph structure: return exactly the same number of body paragraphs, in the same order, each a faithful translation of the corresponding English paragraph.
- Translate the category label to its standard equivalent in the target language.
- Do NOT add, remove, soften or embellish any fact. Translate only what is there.

Source article (JSON):
${JSON.stringify(source, null, 2)}`;
}

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
    try {
      return JSON.parse(raw.trim());
    } catch {
      /* next */
    }
  }
  return null;
}

function translateViaCli(article, locale) {
  const prompt = `${buildPrompt(article, locale)}

Return ONLY a raw JSON object with keys: title, dek, category, body (array of strings, same length as the source), facts (array of strings, same length as the source), media { alt, caption }. No prose, no code fences.`;
  const out = execFileSync(
    "claude",
    ["-p", prompt, "--output-format", "json", "--model", MODEL, "--permission-mode", "default"],
    { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: TIMEOUT_MS, env: { ...process.env } },
  );
  let resultText = out;
  try {
    const envelope = JSON.parse(out);
    resultText = envelope.result ?? envelope.text ?? out;
  } catch {
    /* raw */
  }
  return extractJson(resultText);
}

async function translateViaApi(article, locale) {
  const prompt = `${buildPrompt(article, locale)}

Return the translation by calling the tool "emit_translation" with the full object. Do not write anything else.`;
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    tools: [{ name: "emit_translation", description: "Emit the finished translation.", input_schema: TRANSLATION_SCHEMA }],
    tool_choice: { type: "tool", name: "emit_translation" },
    messages: [{ role: "user", content: prompt }],
  });
  const toolUse = response.content.find((c) => c.type === "tool_use" && c.name === "emit_translation");
  return toolUse ? toolUse.input : null;
}

function validTranslation(article, t) {
  if (!t || typeof t !== "object") return false;
  if (!t.title?.trim() || !t.dek?.trim() || !t.category?.trim()) return false;
  if (!Array.isArray(t.body) || t.body.length !== article.body.length) return false;
  if (t.body.some((p) => typeof p !== "string" || !p.trim())) return false;
  if (!Array.isArray(t.facts) || t.facts.length !== article.facts.length) return false;
  if (t.facts.some((f) => typeof f !== "string" || !f.trim())) return false;
  if (!t.media?.alt?.trim() || !t.media?.caption?.trim()) return false;
  return true;
}

async function main() {
  const articles = readJson(ARTICLES, []);
  const store = readJson(TRANSLATIONS, { schemaVersion: "2.0", translations: [] });
  if (!Array.isArray(store.translations)) store.translations = [];

  // Newest-first so a capped run always translates the freshest stories before
  // chipping away at the backlog.
  const published = articles
    .filter((a) => a.status !== "review")
    .sort((a, b) => new Date(b.updatedAt ?? b.publishedAt).getTime() - new Date(a.updatedAt ?? a.publishedAt).getTime());
  const existing = new Map(store.translations.map((t) => [`${t.articleId}:${t.locale}:${t.sourceUpdatedAt}`, t]));

  // Work list: every (published article, locale) pair without a current full translation.
  const work = [];
  for (const article of published) {
    const sourceVersion = article.updatedAt ?? article.publishedAt;
    for (const locale of LOCALES) {
      const key = `${article.id}:${locale}:${sourceVersion}`;
      const current = existing.get(key);
      if (current && current.coverage === "full") continue;
      work.push({ article, locale, sourceVersion });
    }
  }

  const batch = MAX > 0 ? work.slice(0, MAX) : work;
  console.log(`Translate: mode=${MODE}, model=${MODEL}, locales=${LOCALES.join("+")}, pending=${work.length}, this run=${batch.length}`);

  let done = 0;
  let failed = 0;
  for (const { article, locale, sourceVersion } of batch) {
    try {
      const t = MODE === "cli" ? translateViaCli(article, locale) : await translateViaApi(article, locale);
      if (!validTranslation(article, t)) {
        failed += 1;
        console.log(`  ✗ ${article.id} [${locale}] — invalid/incomplete translation, skipped`);
        continue;
      }
      // Replace any older record for this article+locale, then add the fresh one.
      store.translations = store.translations.filter((r) => !(r.articleId === article.id && r.locale === locale));
      store.translations.push({
        articleId: article.id,
        locale,
        sourceUpdatedAt: sourceVersion,
        status: "published",
        coverage: "full",
        title: t.title.trim(),
        dek: t.dek.trim(),
        category: t.category.trim(),
        body: t.body.map((p) => p.trim()),
        facts: t.facts.map((f) => f.trim()),
        media: { alt: t.media.alt.trim(), caption: t.media.caption.trim() },
      });
      done += 1;
      // Persist after each success so a long run is crash-safe and resumable.
      store.schemaVersion = "2.0";
      store.updatedAt = new Date().toISOString();
      store.visibility = "public";
      fs.writeFileSync(TRANSLATIONS, JSON.stringify(store, null, 2) + "\n");
      console.log(`  ✓ ${article.id} [${locale}]`);
    } catch (err) {
      failed += 1;
      console.log(`  ✗ ${article.id} [${locale}] — ${err.message?.split("\n")[0] ?? err}`);
    }
  }

  console.log(`Translate done — wrote ${done}, failed ${failed}, remaining ${work.length - done}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
