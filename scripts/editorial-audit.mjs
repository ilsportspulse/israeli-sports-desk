import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");
const articlesPath = path.join(root, "data/articles.json");
const mediaPath = path.join(root, "data/article-media.json");
const reportPath = path.join(root, "data/editorial-audit.json");

const articles = JSON.parse(await readFile(articlesPath, "utf8"));
const media = JSON.parse(await readFile(mediaPath, "utf8"));

const minimumWords = { news: 220, explainer: 200, analysis: 300 };
const internalCopy = /verification panel|we have linked|no youtube|this report replaces|editorial trail|embedding permission|internal editorial|local product preview|feed checks|newsroom checked|30-minute cycle|every daily archive|cross-checked before publication|checked before publication/i;
const internationalPublisher = /\b(?:ONE|Sport5|Sport1|Walla Sport|Ynet Sport|Maariv)\b/;
const publisherAttribution = /\b(?:according to|reports?|reported by)\s+(?:ONE|Sport5|Sport1|Walla Sport|Ynet Sport|Maariv)\b/gi;
const stockVoice = /\b(?:a statement of intent|remains to be seen|the questions? now begin|this matters because|only time will tell|the immediate question|what comes next)\b/i;

// These files were manually inspected and depict a different era, generic venue
// or unrelated subject. They must be replaced before the story can be promoted.
const confirmedMediaMismatches = new Set([
  "live-20260714-lev-hasharon-u17-promotion",
  "live-20260714-netanya-nwachukwu",
  "live-20260714-idan-dahan-herzliya",
  "brief-20260714-abramov-security",
  "live-20260714-beitar-flares",
  "live-20260714-israel-u20-handball-poland",
  "live-20260714-basketball-coaches-registration",
  "live-20260714-beitar-four-outside-plans",
]);

function countWords(article) {
  return article.body.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

function isSpecificResearchUrl(source) {
  try {
    const url = new URL(source.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    return url.search.length > 1 || pathParts.length >= 2;
  } catch {
    return false;
  }
}

function inspect(article) {
  const blockers = [];
  const warnings = [];
  const words = countWords(article);
  const visibleCopy = [article.title, article.dek, ...article.body, ...article.facts].join(" ");
  const threshold = minimumWords[article.kind] ?? 220;
  const image = media[article.id] ?? article.image;

  if (words < threshold) blockers.push(`copy-depth:${words}/${threshold}-words`);
  // The newsroom now emits a natural, varied 5-14 paragraphs rather than a fixed
  // 7-paragraph template. Five stays the professional floor for a published story.
  if (article.body.length < 5) blockers.push(`structure:${article.body.length}/5-paragraphs`);
  if (article.facts.length < 4) blockers.push(`evidence:${article.facts.length}/4-confirmed-facts`);
  if (!article.verificationSources?.length) blockers.push("research:no-independent-or-authoritative-verification");
  else if (!article.verificationSources.some(isSpecificResearchUrl)) {
    blockers.push("research:verification-links-are-generic-homepages");
  }
  if (internalCopy.test(visibleCopy)) blockers.push("voice:internal-workflow-copy-visible");
  if (internationalPublisher.test(`${article.title} ${article.dek}`)) {
    blockers.push("presentation:publisher-name-in-headline-or-standfirst");
  }
  if ((article.desk === "international" || article.desk === "world") && internationalPublisher.test(visibleCopy)) {
    blockers.push("presentation:publisher-name-in-international-reader-copy");
  }
  if (!image) blockers.push("media:no-licensed-image");
  if (image?.caption && /does not depict|not shown|not represented as visible|illustrating.*not identified|generic image/i.test(image.caption)) {
    blockers.push("media:caption-confirms-semantic-mismatch");
  }
  if (confirmedMediaMismatches.has(article.id)) blockers.push("media:manual-image-story-mismatch");
  if (image && !/match|game|playing|action|race|stage|team|player|training|competition|tournament|goal|stadium/i.test(`${image.alt} ${image.caption}`)) {
    warnings.push("media:no-action-or-competition-context-detected");
  }
  if (!article.desk) warnings.push("taxonomy:desk-not-assigned");
  if (article.kind === "analysis" && words < 650) warnings.push(`voice:analysis-below-650-word-editorial-target:${words}`);
  const attributionCount = (visibleCopy.match(publisherAttribution) ?? []).length;
  if (attributionCount > 1) warnings.push(`voice:publisher-attribution-heavy:${attributionCount}`);
  if (stockVoice.test(visibleCopy)) warnings.push("voice:stock-editorial-phrase-detected");

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    statusBefore: article.status ?? "published",
    words,
    paragraphs: article.body.length,
    facts: article.facts.length,
    verificationSources: article.verificationSources?.length ?? 0,
    blockers,
    warnings,
  };
}

const items = articles.map(inspect);
let demoted = 0;

if (apply) {
  for (const article of articles) {
    const result = items.find((item) => item.id === article.id);
    if ((article.status ?? "published") !== "review" && result.blockers.length) {
      article.status = "review";
      article.reviewReasons = result.blockers;
      demoted += 1;
    }
  }
  await writeFile(articlesPath, `${JSON.stringify(articles, null, 2)}\n`);
}

const publishedBefore = items.filter((item) => item.statusBefore !== "review").length;
const blockedPublished = items.filter((item) => item.statusBefore !== "review" && item.blockers.length);
const cleanPublished = items.filter((item) => item.statusBefore !== "review" && !item.blockers.length);
const report = {
  generatedAt: new Date().toISOString(),
  mode: apply ? "applied" : "audit-only",
  standard: {
    minimumWords,
    minimumParagraphs: 5,
    minimumConfirmedFacts: 4,
    authoritativeVerificationRequired: true,
    specificSupportingResearchUrlRequired: true,
    internationalPublisherNamesHiddenFromReaderCopy: true,
    publisherNamesProhibitedInHeadlinesAndStandfirsts: true,
    internalWorkflowCopyProhibited: true,
    exactOrHonestCurrentMediaRequired: true,
  },
  summary: {
    totalArticles: articles.length,
    publishedBefore,
    cleanPublished: cleanPublished.length,
    blockedPublished: blockedPublished.length,
    demoted,
    publishedAfter: publishedBefore - demoted,
    reviewAfter: articles.length - (publishedBefore - demoted),
  },
  blockedPublished,
  warnings: items.filter((item) => item.warnings.length),
  cleanPublished,
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report.summary)}\n`);
