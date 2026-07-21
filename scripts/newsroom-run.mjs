// ILSP autonomous newsroom runner (cloud).
// Discovers Israeli-sport candidates, then for each one asks Claude to draft +
// fact-check a full article against the hard gates, using web search. Only
// stories that pass the gates are published; anything uncertain is held as
// "review". The workflow runs audit + tests afterwards, so a malformed cycle is
// never committed. Designed to be conservative: when in doubt, hold.

import { execSync, execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runDailyFeatures } from "./daily-features.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
let MAX_CANDIDATES = Math.max(1, Number(process.env.NEWSROOM_MAX_CANDIDATES ?? 6));
// CLI mode runs a full Claude Code agent loop (several web-search rounds + writing)
// per article, which is thorough but slow. Give each draft a generous wall-clock
// budget and a turn cap so it concludes instead of running forever.
const DRAFT_TIMEOUT_MS = Math.max(60_000, Number(process.env.NEWSROOM_DRAFT_TIMEOUT_MS ?? 6.5 * 60 * 1000));
const DRAFT_MAX_TURNS = Math.max(8, Number(process.env.NEWSROOM_DRAFT_MAX_TURNS ?? 40));

// Two ways to drive the newsroom, in priority order:
//   1. CLI mode  — Claude Code + a Max/Pro subscription token (CLAUDE_CODE_OAUTH_TOKEN).
//      No pay-per-use billing; runs `claude -p` headlessly in the Action.
//   2. API mode  — a pay-per-use Anthropic API key (ANTHROPIC_API_KEY).
// If a subscription token is present we prefer it (that's the current setup).
const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
const apiKey = process.env.ANTHROPIC_API_KEY;
const MODE = oauthToken ? "cli" : apiKey ? "api" : null;

if (!MODE) {
  // Skip quietly (exit 0) so scheduled runs before auth is configured don't spam
  // failure notifications. Set CLAUDE_CODE_OAUTH_TOKEN (Max) or ANTHROPIC_API_KEY
  // to activate the newsroom.
  console.log("No Claude auth configured (CLAUDE_CODE_OAUTH_TOKEN / ANTHROPIC_API_KEY) — skipping this cycle.");
  process.exit(0);
}

// The API client is only needed in API mode; import it lazily so CLI-mode runs
// don't require the SDK to be installed.
let client = null;
if (MODE === "api") {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  client = new Anthropic({ apiKey });
}

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
    body: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 18 },
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
    video: {
      type: "object",
      properties: { title: { type: "string" }, channel: { type: "string" }, youtubeId: { type: "string" }, sourceUrl: { type: "string" } },
    },
    officialSocialPost: {
      type: "object",
      properties: { title: { type: "string" }, account: { type: "string" }, platform: { type: "string" }, url: { type: "string" }, postId: { type: "string" } },
    },
  },
};

const GATES = `HARD EDITORIAL GATES — obey exactly:
- Never invent facts, quotes, results, names or numbers. If you cannot verify something from the source, omit it.
- Verify every material fact against at least TWO independent, named sources; list them all in verificationSources.
- A final score is publishable ONLY if at least two independent outlets explicitly report the match as full-time, and the goal events sum exactly to the score. Otherwise report it as in-progress or hold (set confidence below 0.92 and explain in warning).
- Verify every person/team name transliteration against an official/registry record (Transfermarkt / Wikipedia / league / World Athletics) and record it in nameChecks.
- SCOPE — we cover BOTH Israeli sport AND major world sport:
    • Israeli stories (Israeli competition, athlete or team) → desk "israel". This is our core; prioritise it.
    • GENUINELY SIGNIFICANT international sport → desk "international", and this is WELCOME with NO Israeli angle: the World Cup and its aftermath (results, managerial sackings/appointments, retirements, fallout), the big European leagues and continental cups, major transfers, the NBA, Grand Slams, Grand Tours, athletics, F1, and major championships/events. Cover these properly and keep them fresh — our International corner must reflect what is actually happening in world sport right now.
    • Only truly trivial, purely local-foreign filler with no wider significance should be held — set confidence 0 and warning "not newsworthy". A big, real world-sport story is NOT to be held for "no Israeli angle".
- No publisher names in title or dek; at most once in the body; never on the international desk.
- RICH MEDIA (encouraged): when a genuinely relevant, REAL and verifiable clip or post exists, embed it — it makes the article richer. Include "video" for a real YouTube video (set youtubeId to the exact 11-character id from a working youtube.com/watch?v= or youtu.be/ URL you actually found, plus title, channel, sourceUrl) and/or "officialSocialPost" for an official club/athlete/federation post on X or Instagram (platform "twitter" or "instagram", the exact post/tweet id, url, title, account). ONLY include one you have actually seen and verified via web search — NEVER guess, invent or approximate an id or url. If you cannot verify a real one, omit the field entirely. Prefer official accounts and official highlight channels.
- VOICE: write like a real, experienced human sports journalist for a quality broadsheet — never a template or a robot, never amateurish. Let the STORY and the depth of your reporting dictate the length: a tight news item may be 5-7 paragraphs, a well-researched story or analysis 10-16. Length must be flexible BOTH ways — shorter when the story is small, longer when genuine research (background, context, history, standings, quotes) earns it. NEVER pad, repeat or restate to reach a length; every paragraph must add new information and stay readable — keep paragraphs short (roughly 2-4 sentences), never dense walls of text that tire the reader. Vary paragraph length and sentence rhythm; open with a genuine, specific news hook (not a formula); avoid any repeated fixed structure. Between 5 and 18 paragraphs — pick what the story truly needs, and make different articles read differently.
- Set confidence (0-1) honestly. Set warning to "" only if every core fact is multi-source consistent and nothing is uncertain.
- IMAGE (MANDATORY, and treated as seriously as the facts): research an accurate photo for THIS exact story and return commonsQuery plus commonsCandidates — 2 to 4 REAL Wikimedia Commons files, ranked most-relevant first. For EACH candidate you MUST, via web search on commons.wikimedia.org: (1) confirm the file page actually exists and is a JPEG photograph (not a logo, flag, map, diagram or artwork), (2) confirm a reusable licence (CC BY, CC BY-SA, CC0 or public domain) and record it, and (3) CONFIRM IT DEPICTS THE RIGHT SUBJECT — the specific person, club, venue or competition in the story. Beware NAMESAKES and wrong context: e.g. for basketball's David Roddy do NOT return a US Air Force serviceman of the same name; check the file's description/categories confirm the correct sport, club and person. Priority of subject: the named athlete/player themselves → their current club or national team → the exact stadium/arena → the competition or trophy. A stadium or club photo is fine as an honest file photo; an unrelated or wrong-person image is a serious failure. If you CANNOT verify at least one correctly-identified image, return commonsCandidates as an empty array [] and say so in warning — the story will be held rather than published with a wrong photo. NEVER invent, guess or approximate a file name.`;

function buildPrompt(candidate, todayIso) {
  return `You are the copy desk for Israel Sports Pulse (English-language Israeli sports newsroom).
Draft ONE article from this source: ${candidate.url}
(reported title: ${candidate.title ?? "unknown"})

Use web search to read the source and to verify every fact against independent sources.
${GATES}

Fixed fields: publishedAt/updatedAt = "${todayIso}", theme = "night-pitch", pick a sensible category (e.g. "Israeli Football", "Israeli Basketball", "Israelis Abroad", "Israeli Olympic Sport", "World Football") and desk. Make id start with "live-" + date + a short slug, and a descriptive kebab slug with no publisher names.`;
}

// Pull the article object out of free-form model output (handles ```json fences
// and surrounding prose by matching the outermost balanced {...}).
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
      /* try the next candidate */
    }
  }
  return null;
}

// CLI mode: drive Claude Code headlessly with a subscription token. Claude Code
// has web search/fetch built in; we ask it to end with the raw article JSON.
function draftViaCli(candidate, todayIso) {
  const prompt = `${buildPrompt(candidate, todayIso)}

Fields required in the JSON object: id, slug, title, dek, category, desk ("israel" or "international"), kind, storyForm, publishedAt, updatedAt, readMinutes (number), source {name,url}, verificationSources [{label,url}], body (array of 5-18 strings; the natural length for THIS story — shorter or longer as the reporting earns, never padded, never a fixed count), facts (array of >=5 strings), theme, homepagePriority (number), homepageReason, dedupeKey, aiDisclosure, nameChecks [{hebrew,english,verificationUrl,confidence}], confidence (0-1 number), warning (string, "" if none), commonsQuery, commonsCandidates [{title,creditUrl,credit,license}] (REQUIRED: 2-4 web-verified, correctly-identified Commons photos as described above, or [] if none can be verified — the story is then held rather than shown with a wrong image). OPTIONAL rich media (include ONLY if you verified a real one, else omit): video {title,channel,youtubeId,sourceUrl} for a real YouTube clip, officialSocialPost {title,account,platform ("twitter"|"instagram"),url,postId} for a real official X/Instagram post.

Work efficiently: do at most 5 web searches to gather and cross-check the essential facts, then stop researching and write. If you cannot verify enough to meet the gates within that budget, still emit the object with an honest low confidence and a warning rather than searching endlessly.

Output ONLY the raw JSON object as your final message — no prose, no code fences.`;

  // Headless allow-list: ONLY web read tools may run; every other tool (file
  // writes, shell, etc.) is auto-denied. No blanket permission-skip is used — the
  // agent can research the web and nothing else. The script, not the agent,
  // writes the article to disk. --max-turns bounds the agent loop so a draft
  // concludes within the wall-clock budget instead of searching indefinitely.
  const out = execFileSync(
    "claude",
    [
      "-p", prompt,
      "--output-format", "json",
      "--model", MODEL,
      "--allowedTools", "WebSearch,WebFetch",
      "--permission-mode", "default",
      "--max-turns", String(DRAFT_MAX_TURNS),
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      timeout: DRAFT_TIMEOUT_MS,
      env: { ...process.env },
    },
  );

  let resultText = out;
  try {
    const envelope = JSON.parse(out);
    resultText = envelope.result ?? envelope.text ?? out;
  } catch {
    /* not the JSON envelope — treat stdout as the raw result */
  }
  return extractJson(resultText);
}

// API mode: forced tool call gives us a schema-validated object directly.
async function draftViaApi(candidate, todayIso) {
  const prompt = `${buildPrompt(candidate, todayIso)}

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

async function draftAndVerify(candidate, todayIso) {
  return MODE === "cli" ? draftViaCli(candidate, todayIso) : draftViaApi(candidate, todayIso);
}

function passesGates(article, confidenceMin = 0.92, namecheckMin = 0.9) {
  if (!article) return false;
  if (typeof article.confidence !== "number" || article.confidence < confidenceMin) return false;
  if (article.warning && article.warning.trim() !== "") return false;
  if (!Array.isArray(article.body) || article.body.length < 5) return false;
  const names = article.nameChecks ?? [];
  if (names.some((n) => typeof n.confidence === "number" && n.confidence < namecheckMin)) return false;
  return true;
}

async function main() {
  console.log(`Newsroom runner starting — mode=${MODE}, model=${MODEL}, max=${MAX_CANDIDATES}` +
    (MODE === "cli" ? `, draftBudget=${Math.round(DRAFT_TIMEOUT_MS / 1000)}s, maxTurns=${DRAFT_MAX_TURNS}` : ""));

  // 0. Backoffice-editable gate settings (nothing hardcoded). Falls back to the
  // conservative defaults baked into passesGates if the file is absent.
  const settings = await readJson("data/settings.json").catch(() => ({}));
  const gates = settings.newsroom ?? {};
  if (gates.enabled === false) {
    console.log("Newsroom is turned OFF in backoffice settings — skipping this cycle.");
    return;
  }
  const CONFIDENCE_MIN = typeof gates.confidenceThreshold === "number" ? gates.confidenceThreshold : 0.92;
  const NAMECHECK_MIN = typeof gates.namecheckThreshold === "number" ? gates.namecheckThreshold : 0.9;
  const AUTO_PUBLISH = gates.autoPublish === true;
  if (typeof gates.maxCandidates === "number" && !process.env.NEWSROOM_MAX_CANDIDATES) {
    MAX_CANDIDATES = Math.max(1, gates.maxCandidates);
  }
  console.log(`Gates — confidence>=${CONFIDENCE_MIN}, namecheck>=${NAMECHECK_MIN}, autoPublish=${AUTO_PUBLISH}`);

  // 0b. Daily recurring features (Retro article, fresh quiz, ILSP column and the
  // Tour de France beat). Each self-gates to once per day, so on the 30-minute
  // schedule only the first cycle of the day produces them. Wrapped so a failure
  // here can never abort the main newsroom cycle.
  if (gates.dailyFeatures !== false) {
    try {
      const daily = await runDailyFeatures();
      console.log("Daily features:", JSON.stringify(daily));
    } catch (err) {
      console.warn("Daily features step failed (continuing):", err?.message?.split("\n")[0]);
    }
  }

  // 1. Discovery (writes candidates into data/ingestion-report.json).
  try {
    execSync("npm run ingest:dry", { cwd: root, stdio: "inherit" });
  } catch {
    console.warn("Discovery step reported a non-zero exit; continuing with whatever candidates exist.");
  }

  const report = await readJson("data/ingestion-report.json").catch(() => ({ candidates: [] }));

  // In CLI mode each draft is slow, so cap how many we attempt per cycle to fit
  // inside the Action's job timeout (setup + discovery + N*draftBudget + tests
  // must stay under 30 min). API mode is fast and keeps the full requested count.
  let effectiveMax = MAX_CANDIDATES;
  if (MODE === "cli") {
    const cliBudgetMs = Math.max(DRAFT_TIMEOUT_MS, Number(process.env.NEWSROOM_CLI_TIME_BUDGET_MS ?? 10 * 60 * 1000));
    const fitsBudget = Math.max(1, Math.floor(cliBudgetMs / DRAFT_TIMEOUT_MS));
    effectiveMax = Math.min(MAX_CANDIDATES, fitsBudget);
    if (effectiveMax < MAX_CANDIDATES) {
      console.log(`CLI mode: capping ${MAX_CANDIDATES} -> ${effectiveMax} candidates to fit the job timeout.`);
    }
  }

  const candidates = (report.candidates ?? []).slice(0, effectiveMax);
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
  let skipped = 0;
  const decisions = []; // per-candidate outcome for the backoffice monitor

  for (const candidate of candidates) {
    let article;
    try {
      article = await draftAndVerify(candidate, todayIso);
    } catch (error) {
      console.warn(`Draft failed for ${candidate.url}: ${error.message}`);
      decisions.push({ url: candidate.url, decision: "error", reason: error.message });
      skipped += 1;
      continue;
    }
    if (!article || !article.id || !article.slug) {
      decisions.push({ url: candidate.url, decision: "skipped", reason: "no valid article emitted" });
      skipped += 1;
      continue;
    }
    if (seen.has(norm(article.id)) || seen.has(norm(article.slug)) || (article.dedupeKey && seen.has(norm(article.dedupeKey)))) {
      console.log(`Skip duplicate: ${article.slug}`);
      decisions.push({ slug: article.slug, title: article.title, decision: "duplicate" });
      skipped += 1;
      continue;
    }
    const gated = passesGates(article, CONFIDENCE_MIN, NAMECHECK_MIN);
    // Auto-publish when the hard gates pass AND the backoffice enables it; otherwise
    // hold for review. A relevant licensed image is sourced automatically after this
    // loop (see the image step below); stories that still cannot be matched to a
    // unique image are held there, so nothing publishes without its own photo.
    article.status = gated && AUTO_PUBLISH ? "published" : "review";
    if (!article.warning) article.warning = "";
    if (!article.nameChecks) article.nameChecks = [];

    articles.unshift(article);
    seen.add(norm(article.id));
    seen.add(norm(article.slug));
    if (article.dedupeKey) seen.add(norm(article.dedupeKey));
    if (article.status === "published") published += 1; else review += 1;
    decisions.push({
      slug: article.slug,
      title: article.title,
      confidence: article.confidence,
      gate: gated ? "pass" : "hold",
      decision: article.status,
      reason: gated ? "" : (article.warning || "below gate thresholds"),
    });
    console.log(`Drafted ${article.slug} — confidence ${article.confidence}, gate ${gated ? "PASS" : "HOLD"} -> ${article.status}`);
  }

  if (Array.isArray(data)) {
    await writeJson("data/articles.json", articles);
  } else {
    data.articles = articles;
    await writeJson("data/articles.json", data);
  }

  // Give every newly published story its OWN relevant, licensed image by searching
  // the free image sources (Wikimedia Commons first, Openverse as a fallback). This
  // is incremental: only stories still missing an image are looked up, so the run
  // stays light. Any story that cannot be matched to a UNIQUE image is held for
  // review instead of published without one — so the "every published story has its
  // own licensed image" gate stays green and no story ever shows a shared/mismatched
  // photo. Set newsroom.sourceImages=false in settings to skip this.
  // Run whenever image sourcing is enabled — NOT only when the main draft loop
  // published something. Daily features (Retro/column/Tour) are published by
  // runDailyFeatures and would otherwise skip both sourcing and the imageless-demote
  // guard, leaving a published story with no image and failing the "own image" test.
  if (gates.sourceImages !== false) {
    try {
      execSync("node scripts/source-commons-media.mjs", { cwd: root, stdio: "inherit" });
    } catch {
      console.warn("Image sourcing exited non-zero; unmatched stories will be held for review.");
    }
    try {
      // A photo is an enhancement, NOT a publish gate — a story never hangs for
      // lack of one (it shows a clean category visual instead of a wrong photo).
      // We only keep the media map clean: if two published stories ended up with the
      // SAME image, drop the duplicate entry (that story falls back to its category
      // visual) so the images that DO show are unique. Nothing is demoted here.
      const media = await readJson("data/article-media.json").catch(() => ({}));
      const seenSrc = new Set();
      const seenUrl = new Set();
      let dropped = 0;
      for (const article of articles) {
        if ((article.status ?? "published") === "review") continue;
        const asset = media[article.id];
        if (!asset?.src || !asset?.creditUrl) continue;
        if (seenSrc.has(asset.src) || seenUrl.has(asset.creditUrl)) {
          delete media[article.id];
          dropped += 1;
        } else {
          seenSrc.add(asset.src);
          seenUrl.add(asset.creditUrl);
        }
      }
      if (dropped) {
        console.log(`Dropped ${dropped} duplicate image entr(ies); those stories use their category visual.`);
        await writeJson("data/article-media.json", media);
      }
    } catch (error) {
      console.warn(`Image dedupe step failed (non-fatal): ${error.message}`);
    }
  }

  // Translate the newest still-untranslated stories to FR/ES so /fr and /es never
  // show English at the top. Tightly capped (a couple of stories, short per-call
  // timeout) so it can never blow the 30-minute job window, and fully wrapped so a
  // translation hiccup never fails or blocks the publish. It is incremental and
  // newest-first, so over a few cycles it always catches up. Set newsroom.translate
  // = false to disable.
  if (gates.translate !== false && published > 0) {
    try {
      const max = typeof gates.translateMax === "number" ? gates.translateMax : 1;
      execSync("node scripts/translate-articles.mjs", {
        cwd: root,
        stdio: "inherit",
        env: { ...process.env, TRANSLATE_MAX: String(max), TRANSLATE_TIMEOUT_MS: "180000" },
      });
    } catch {
      console.warn("Translation step did not finish this cycle; newest stories will be caught up next cycle.");
    }
  }

  // Monitoring log for the backoffice: newest cycle first, keep the last 50.
  try {
    const prior = await readJson("data/newsroom-log.json").catch(() => []);
    const log = Array.isArray(prior) ? prior : [];
    log.unshift({
      ts: todayIso, mode: MODE, model: MODEL,
      candidates: candidates.length, published, review, skipped,
      gates: { confidenceMin: CONFIDENCE_MIN, namecheckMin: NAMECHECK_MIN, autoPublish: AUTO_PUBLISH },
      decisions,
    });
    await writeJson("data/newsroom-log.json", log.slice(0, 50));
  } catch (error) {
    console.warn(`Could not write newsroom log: ${error.message}`);
  }

  console.log(`Cycle done — ${published} published, ${review} held for review, ${skipped} skipped.`);
}

await main();
