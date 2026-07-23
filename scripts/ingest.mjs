import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNamebookPrompt,
  extractArticleText,
  extractFeedLinks,
  extractLinks,
  extractMetadata,
  extractOneHomepageLinks,
  isDuplicate,
  parseRobots,
  responseText,
  slugify,
} from "./newsroom-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const fallbackMaxPerSource = Math.max(1, Number(process.env.NEWSROOM_MAX_PER_SOURCE ?? 500));
const autoPublish = process.env.NEWSROOM_AUTO_PUBLISH === "true";
const userAgent = process.env.NEWSROOM_USER_AGENT ?? "IsraelSportsPulseBot/0.1 (+editor@example.com)";
const model = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
const apiKey = process.env.OPENAI_API_KEY;
const maxCandidateAgeHours = Math.max(1, Number(process.env.NEWSROOM_MAX_CANDIDATE_AGE_HOURS ?? 72));
const robotsFallbacks = JSON.parse(
  await readFile(path.join(root, "config/robots-cache.json"), "utf8"),
);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readJson(file) {
  return JSON.parse(await readFile(path.join(root, file), "utf8"));
}

async function readJsonOptional(file, fallback) {
  try {
    return await readJson(file);
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function fetchText(url, timeoutMs = 18_000) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9" },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await wait(450 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

const robotsCache = new Map();

async function isRobotsAllowed(url) {
  const origin = new URL(url).origin;
  if (robotsCache.has(origin)) {
    return parseRobots(robotsCache.get(origin), url, userAgent);
  }
  try {
    const robots = await fetchText(`${origin}/robots.txt`, 12_000);
    robotsCache.set(origin, robots);
    return parseRobots(robots, url, userAgent);
  } catch {
    const fallback = robotsFallbacks[origin];
    if (!fallback?.verifiedAt || !fallback?.robots) return false;
    const age = Date.now() - new Date(fallback.verifiedAt).getTime();
    if (!Number.isFinite(age) || age > 30 * 24 * 60 * 60 * 1000) return false;
    robotsCache.set(origin, fallback.robots);
    return parseRobots(fallback.robots, url, userAgent);
  }
}

const outputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 20, maxLength: 110 },
    dek: { type: "string", minLength: 45, maxLength: 260 },
    category: {
      type: "string",
      enum: ["Israeli Football", "Israeli Basketball", "Israeli Handball", "Israeli Volleyball", "Israeli Judo", "Israeli Olympic Sport", "Israeli Women’s Sport", "Israeli Youth Sport", "Israelis Abroad", "World Football", "NBA", "Olympics", "Tennis", "Cycling", "Global Sport"],
    },
    kind: { type: "string", enum: ["news", "explainer"] },
    storyForm: {
      type: "string",
      enum: ["breaking-update", "reported-news", "match-report", "transfer-report", "explainer", "profile", "news-analysis"],
    },
    body: { type: "array", minItems: 5, maxItems: 12, items: { type: "string", minLength: 45, maxLength: 1400 } },
    facts: { type: "array", minItems: 4, maxItems: 7, items: { type: "string", minLength: 12, maxLength: 240 } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    homepagePriority: { type: "number", minimum: 0, maximum: 100 },
    homepageReason: { type: "string", minLength: 12, maxLength: 180 },
    dedupeKey: { type: "string", minLength: 12, maxLength: 140 },
    nameChecks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          hebrew: { type: "string" },
          english: { type: "string" },
          verificationUrl: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["hebrew", "english", "verificationUrl", "confidence"],
      },
    },
    verificationSources: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string", minLength: 12, maxLength: 140 },
          url: { type: "string", minLength: 12, maxLength: 500 },
          supports: { type: "string", minLength: 15, maxLength: 240 },
          authority: { type: "string", enum: ["official", "independent"] },
        },
        required: ["label", "url", "supports", "authority"],
      },
    },
    warning: { type: "string" },
  },
  required: ["title", "dek", "category", "kind", "storyForm", "body", "facts", "confidence", "homepagePriority", "homepageReason", "dedupeKey", "nameChecks", "verificationSources", "warning"],
};

async function createEnglishDraft({ source, metadata, articleText, namebook }) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing; the item remains in the ingestion report");
  const instructions = `You are the copy desk for Israel Sports Pulse (ILSP), an independent English-language Israeli sports publication.

Write original, intellectually serious English sports journalism from the bounded source material. Never produce a sentence-by-sentence or full translation. Never invent a quote, score, transfer, injury, date, identity or attribution. Preserve uncertainty words such as reported, expected and could. Use idiomatic professional British sports terminology and distinguish a completed event from a rumour.

Choose storyForm and depth from the event rather than forcing every item into one template:
- breaking-update: 280–420 words for a simple, fully confirmed development;
- reported-news, match-report or transfer-report: normally 450–750 words;
- explainer or profile: normally 650–1,000 words;
- news-analysis: normally 800–1,200 words and only when the evidence supports a real argument.
These are editorial ranges, not quotas. A clean short report is better than padded copy; a complex ownership, disciplinary, tactical or institutional story must not be compressed into six generic paragraphs. Use between five and twelve substantive paragraphs, varying paragraph length and sentence rhythm naturally.

Write for an informed adult reader. Explain causation, competitive incentives, contractual or institutional constraints, and the consequence for the next sporting decision. Prefer precise nouns and active verbs. Avoid breathless fan language, moralising, school-essay transitions, generic scene-setting and stock phrases such as “the questions now begin”, “this matters because”, “only time will tell”, “a statement of intent” and “remains to be seen”. Do not repeat a fixed sequence of event, context, caveat, future, conclusion. Let the event determine the architecture.

State independently verified facts directly. Mention the discovering publisher at most once, and only when a material exclusive claim cannot be established independently. Never chain publisher names or describe the sourcing, verification or drafting process to readers. Paraphrase source quotations unless the exact words are essential.

Write a direct, audience-driving headline without clickbait or withheld facts. Score homepagePriority using editorial impact, not recency alone: 90–100 for major confirmed transfers or collapses, championships, national-team breakthroughs and serious breaking events; 75–89 for major club signings, injuries or decisive competitive developments; 55–74 for useful squad and competition news; below 55 for soft features, sponsorships, merchandise, routine renewals and minor appointments. Explain that score briefly in homepageReason.

Create a stable dedupeKey for the underlying event, not the article angle. Use lowercase English words in this order: sport, competition or club, principal person/team, action or event, and date/window. Reports from different outlets about the same transfer, investigation, result or signing must converge on the same key; commentary and follow-ups about that same event must not create a second article.

Source priority controls discovery volume only. It must never influence factual confidence, headline strength or homepagePriority. A major exclusive from Walla Sport, Ynet Sport or Sport1/Maariv can and should outrank a routine ONE or Sport5 item.

Use web search narrowly to verify every material identity, result, contract, injury, disciplinary status and competition fact that appears in the report. Return between one and five claim-specific official or genuinely independent verification URLs, state precisely what each supports and never use a generic organisation homepage as evidence. For every Hebrew personal name not already in the verified namebook, check the athlete's current club, federation, league or official competition record. If no authoritative Latin spelling is found, transliterate cautiously, lower name confidence and explain the problem in warning. Verification may confirm or narrow the bounded story; it must not introduce a speculative side story. Return only the required JSON.

${buildNamebookPrompt(namebook)}`;
  const input = `PRIMARY SOURCE: ${source.name}\nSOURCE URL: ${metadata.url}\nHEBREW HEADLINE: ${metadata.title}\nSOURCE DESCRIPTION: ${metadata.description}\nSOURCE DATE: ${metadata.publishedAt || "unknown"}\nSOURCE AUTHOR: ${metadata.author || "unknown"}\n\nSOURCE EXCERPT (used transiently; do not reproduce):\n${articleText}`;
  const body = {
    model,
    instructions,
    input,
    reasoning: { effort: "low" },
    text: { format: { type: "json_schema", name: "newsroom_story", strict: true, schema: outputSchema } },
  };
  if (process.env.NEWSROOM_WEB_VERIFY !== "false") body.tools = [{ type: "web_search" }];
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${(await response.text()).slice(0, 400)}`);
  const payload = await response.json();
  const text = responseText(payload);
  if (!text) throw new Error("The Responses API returned no structured text");
  return JSON.parse(text);
}

function chooseTheme(category) {
  if (category.includes("Basketball") || category === "NBA") return "blue-court";
  if (category === "Cycling" || category === "Tennis") return "golden-hour";
  if (category === "Olympics") return "track-lines";
  if (category === "Israelis Abroad") return "transfer-grid";
  if (category === "World Football") return "press-box";
  return "night-pitch";
}

function toArticle(draft, source, metadata) {
  const nameConfidence = draft.nameChecks.length ? Math.min(...draft.nameChecks.map((check) => check.confidence)) : 1;
  const publishable = draft.confidence >= 0.92 && nameConfidence >= 0.9 && !draft.warning;
  const publishedAt = metadata.publishedAt && !Number.isNaN(Date.parse(metadata.publishedAt))
    ? new Date(metadata.publishedAt).toISOString()
    : new Date().toISOString();
  return {
    id: `ingest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slug: slugify(draft.title),
    title: draft.title,
    dek: draft.dek,
    category: draft.category,
    desk: ["World Football", "NBA", "Olympics", "Tennis", "Cycling", "Global Sport"].includes(draft.category) ? "international" : "israel",
    kind: draft.kind,
    storyForm: draft.storyForm,
    publishedAt,
    readMinutes: Math.max(2, Math.round(draft.body.join(" ").split(/\s+/).length / 210)),
    source: { name: source.name, url: metadata.url, originalTitle: metadata.title, author: metadata.author || undefined },
    verificationSources: [
      ...draft.verificationSources.map((check) => ({ label: check.label, url: check.url })),
      ...draft.nameChecks.map((check) => ({ label: `${check.english} identity record`, url: check.verificationUrl })),
    ].filter((item, index, items) => item.url && items.findIndex((candidate) => candidate.url === item.url) === index),
    body: draft.body,
    facts: draft.facts,
    theme: chooseTheme(draft.category),
    homepagePriority: draft.homepagePriority,
    homepageReason: draft.homepageReason,
    dedupeKey: draft.dedupeKey,
    status: autoPublish && publishable ? "published" : "review",
    aiDisclosure: "AI-assisted original English draft. Source attribution and identity checks are retained for editorial review.",
  };
}

async function run() {
  const [sources, namebook, storedArticles, previousReport, storedLedger] = await Promise.all([
    readJson("config/sources.json"),
    readJson("config/namebook.json"),
    readJson("data/articles.json"),
    readJsonOptional("data/ingestion-report.json", { candidates: [] }),
    readJsonOptional("data/discovery-ledger.json", { items: [] }),
  ]);
  const startedAt = new Date().toISOString();
  const seedItems = storedLedger.items?.length
    ? storedLedger.items
    : (previousReport.candidates ?? []).map((candidate) => ({
        url: candidate.url,
        canonicalUrl: candidate.url,
        source: candidate.source,
        title: candidate.title,
        publishedAt: candidate.publishedAt,
        firstSeenAt: previousReport.startedAt ?? startedAt,
        lastSeenAt: previousReport.finishedAt ?? previousReport.startedAt ?? startedAt,
        seenCount: 1,
      }));
  const discoveryByUrl = new Map(seedItems.filter((item) => item.url).map((item) => [item.url, item]));
  const report = {
    startedAt,
    dryRun,
    measurement: "Only first-seen source URLs count as new candidates; previously seen URLs are reported separately.",
    candidateFreshnessWindowHours: maxCandidateAgeHours,
    sources: [],
    candidates: [],
    drafted: [],
    errors: [],
  };
  const newArticles = [];

  const enabledSources = sources
    .filter((item) => item.enabled)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const source of enabledSources) {
    const sourceLimit = Math.max(1, Number(source.maxPerRun ?? fallbackMaxPerSource));
    const scanLimit = Math.max(sourceLimit, Number(source.maxScanPerRun ?? sourceLimit * 8));
    const sourceReport = {
      id: source.id,
      priority: source.priority ?? 0,
      newCandidateTarget: sourceLimit,
      scanLimit,
      fetched: false,
      linksScanned: 0,
      previouslySeen: 0,
      stale: 0,
      existingStoryMatches: 0,
      accepted: 0,
      allowed: false,
    };
    report.sources.push(sourceReport);
    try {
      let listingUrl = source.feedUrl ?? source.sectionUrl;
      let listingUsesFeed = Boolean(source.feedUrl);
      sourceReport.allowed = await isRobotsAllowed(listingUrl);
      if (!sourceReport.allowed) throw new Error("robots.txt did not permit this fetch or could not be verified");
      let listingHtml;
      try {
        listingHtml = await fetchText(listingUrl);
      } catch (feedError) {
        if (!source.feedUrl || !source.sectionUrl || source.sectionUrl === source.feedUrl) throw feedError;
        listingUrl = source.sectionUrl;
        listingUsesFeed = false;
        sourceReport.allowed = await isRobotsAllowed(listingUrl);
        if (!sourceReport.allowed) throw feedError;
        listingHtml = await fetchText(listingUrl);
      }
      sourceReport.fetched = true;
      const links = (source.feedFormat === "one-homepage-json"
        ? extractOneHomepageLinks(JSON.parse(listingHtml), source.homepage)
        : listingUsesFeed
          ? extractFeedLinks(listingHtml, listingUrl)
          : extractLinks(listingHtml, source.sectionUrl, source.articleHints, source.allowedHosts ?? []))
        .filter((link) => !source.articleHints?.length || source.articleHints.some((hint) => link.url.toLowerCase().includes(hint.toLowerCase())))
        .slice(0, scanLimit);
      sourceReport.linksScanned = links.length;
      let accepted = 0;
      for (const link of links) {
        if (accepted >= sourceLimit) break;
        const priorDiscovery = discoveryByUrl.get(link.url);
        if (priorDiscovery) {
          priorDiscovery.lastSeenAt = startedAt;
          priorDiscovery.seenCount = (priorDiscovery.seenCount ?? 1) + 1;
          // Rollover: a link discovered in an earlier cycle but never turned into
          // an article (drafting was over that cycle's budget, or failed) is
          // re-offered as a candidate every cycle until it is drafted or ages out
          // of the freshness window. Without this, anything beyond a cycle's draft
          // cap was marked "seen" and silently lost forever — the root cause of
          // missing coverage. Already-published events are filtered by the
          // duplicate check below, so re-offering is safe.
          const ageMs = Date.parse(priorDiscovery.publishedAt || link.publishedAt || "");
          const inWindow = !Number.isFinite(ageMs) || Date.now() - ageMs <= maxCandidateAgeHours * 60 * 60 * 1000;
          const undrafted = priorDiscovery.disposition === "candidate";
          const canonical = priorDiscovery.canonicalUrl || link.url;
          const title = priorDiscovery.title || link.anchor;
          const alreadyStory = isDuplicate({ url: canonical, title }, [...storedArticles, ...newArticles]);
          if (undrafted && inWindow && !alreadyStory && accepted < sourceLimit) {
            accepted += 1;
            sourceReport.accepted = accepted;
            report.candidates.push({
              source: source.name,
              url: canonical,
              title,
              publishedAt: priorDiscovery.publishedAt || "",
              imageStatus: "no-source-image",
              rollover: true,
            });
          } else {
            sourceReport.previouslySeen += 1;
          }
          continue;
        }
        if (isDuplicate({ url: link.url, title: link.anchor }, [...storedArticles, ...newArticles])) {
          sourceReport.existingStoryMatches += 1;
          discoveryByUrl.set(link.url, {
            url: link.url,
            canonicalUrl: link.url,
            source: source.name,
            title: link.anchor,
            publishedAt: link.publishedAt ?? "",
            firstSeenAt: startedAt,
            lastSeenAt: startedAt,
            seenCount: 1,
            disposition: "existing-story-match",
          });
          continue;
        }
        await wait(source.minimumDelayMs);
        if (!(await isRobotsAllowed(link.url))) continue;
        const html = await fetchText(link.url);
        const extractedMetadata = extractMetadata(html, link.url);
        const metadata = {
          ...extractedMetadata,
          publishedAt: extractedMetadata.publishedAt || link.publishedAt || "",
          image: extractedMetadata.image || link.image || "",
        };
        if (!metadata.title) continue;
        const discoveryRecord = {
          url: link.url,
          canonicalUrl: metadata.url,
          source: source.name,
          title: metadata.title,
          publishedAt: metadata.publishedAt,
          firstSeenAt: startedAt,
          lastSeenAt: startedAt,
          seenCount: 1,
          disposition: "candidate",
        };
        discoveryByUrl.set(link.url, discoveryRecord);
        if (isDuplicate({ url: metadata.url, title: metadata.title }, [...storedArticles, ...newArticles])) {
          sourceReport.existingStoryMatches += 1;
          discoveryRecord.disposition = "existing-story-match";
          continue;
        }
        const publishedAtMs = Date.parse(metadata.publishedAt);
        if (Number.isFinite(publishedAtMs) && Date.now() - publishedAtMs > maxCandidateAgeHours * 60 * 60 * 1000) {
          sourceReport.stale += 1;
          discoveryRecord.disposition = "stale";
          continue;
        }
        accepted += 1;
        sourceReport.accepted = accepted;
        const candidate = { source: source.name, ...metadata, imageStatus: metadata.image ? "source-image-not-imported-rights-review-required" : "no-source-image" };
        report.candidates.push(candidate);
        if (dryRun || !apiKey) continue;
        try {
          const draft = await createEnglishDraft({ source, metadata, articleText: extractArticleText(html), namebook });
          const article = toArticle(draft, source, metadata);
          if (isDuplicate({ url: metadata.url, title: draft.title, dedupeKey: draft.dedupeKey }, [...storedArticles, ...newArticles])) {
            report.drafted.push({ id: article.id, title: article.title, status: "duplicate-merged", source: source.name, warning: "Matched an existing canonical event" });
            continue;
          }
          newArticles.push(article);
          report.drafted.push({ id: article.id, title: article.title, status: article.status, source: source.name, warning: draft.warning });
        } catch (error) {
          report.errors.push({ source: source.name, url: metadata.url, error: error instanceof Error ? error.message : String(error) });
        }
      }
    } catch (error) {
      report.errors.push({ source: source.name, url: source.feedUrl ?? source.sectionUrl, error: error instanceof Error ? error.message : String(error) });
    }
  }

  report.finishedAt = new Date().toISOString();
  report.summary = {
    candidates: report.candidates.length,
    linksScanned: report.sources.reduce((total, source) => total + source.linksScanned, 0),
    previouslySeen: report.sources.reduce((total, source) => total + source.previouslySeen, 0),
    stale: report.sources.reduce((total, source) => total + source.stale, 0),
    existingStoryMatches: report.sources.reduce((total, source) => total + source.existingStoryMatches, 0),
    drafts: newArticles.length,
    errors: report.errors.length,
  };
  await writeFile(
    path.join(root, "data/discovery-ledger.json"),
    `${JSON.stringify({ updatedAt: report.finishedAt, items: [...discoveryByUrl.values()].slice(-10000) }, null, 2)}\n`,
  );
  await writeFile(path.join(root, "data/ingestion-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (!dryRun && newArticles.length) {
    await writeFile(path.join(root, "data/articles.json"), `${JSON.stringify([...storedArticles, ...newArticles], null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(report.summary)}\n`);
  if (report.errors.length && !report.candidates.length) process.exitCode = 1;
}

await run();
