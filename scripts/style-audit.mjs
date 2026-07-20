import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const articles = JSON.parse(await readFile(path.join(root, "data/articles.json"), "utf8"))
  .filter((article) => article.status !== "review");

const stockPhrases = [
  ["statement-of-intent", /\ba statement of intent\b/i],
  ["remains-to-be-seen", /\bremains to be seen\b/i],
  ["questions-now-begin", /\bthe questions? now begin\b/i],
  ["this-matters-because", /\bthis matters because\b/i],
  ["only-time-will-tell", /\bonly time will tell\b/i],
  ["immediate-question", /\bthe immediate question\b/i],
  ["what-comes-next", /\bwhat comes next\b/i],
];
const publisherAttribution = /\b(?:according to|reports?|reported by)\s+(?:ONE|Sport5|Sport1|Walla Sport|Ynet Sport|Maariv)\b/gi;

function words(text) {
  return text.trim().match(/[\p{L}\p{N}’'-]+/gu) ?? [];
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z“])/)
    .map((sentence) => words(sentence).length)
    .filter(Boolean);
}

function round(value, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const items = articles.map((article) => {
  const text = article.body.join(" ");
  const wordList = words(text);
  const sentenceLengths = sentences(text);
  const paragraphLengths = article.body.map((paragraph) => words(paragraph).length);
  const normalizedWords = wordList.map((word) => word.toLocaleLowerCase("en"));
  const flags = [];
  const phraseFlags = stockPhrases.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  const attributionCount = (text.match(publisherAttribution) ?? []).length;
  const targetMinimum = article.kind === "analysis" ? 650 : article.kind === "explainer" ? 500 : 280;

  if (wordList.length < targetMinimum) flags.push(`below-editorial-target:${wordList.length}/${targetMinimum}`);
  if (article.kind === "analysis" && article.body.length < 8) flags.push(`analysis-structure:${article.body.length}/8-paragraphs`);
  if (article.body.length === 6) flags.push("repeated-six-paragraph-template-risk");
  if (phraseFlags.length) flags.push(...phraseFlags.map((flag) => `stock-phrase:${flag}`));
  if (attributionCount > 1) flags.push(`publisher-attribution-heavy:${attributionCount}`);
  if (sentenceLengths.length && Math.max(...sentenceLengths) - Math.min(...sentenceLengths) < 8) {
    flags.push("sentence-rhythm-low-variation");
  }

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    kind: article.kind,
    words: wordList.length,
    paragraphs: article.body.length,
    paragraphWords: {
      shortest: Math.min(...paragraphLengths),
      longest: Math.max(...paragraphLengths),
      average: round(mean(paragraphLengths)),
    },
    sentenceWords: {
      shortest: sentenceLengths.length ? Math.min(...sentenceLengths) : 0,
      longest: sentenceLengths.length ? Math.max(...sentenceLengths) : 0,
      average: round(mean(sentenceLengths)),
    },
    lexicalDiversity: wordList.length ? round(new Set(normalizedWords).size / wordList.length, 3) : 0,
    publisherAttributions: attributionCount,
    flags,
  };
});

const paragraphDistribution = Object.fromEntries(
  [...new Set(items.map((item) => item.paragraphs))]
    .sort((a, b) => a - b)
    .map((count) => [count, items.filter((item) => item.paragraphs === count).length]),
);
const dominantParagraphEntry = Object.entries(paragraphDistribution)
  .sort((a, b) => b[1] - a[1])[0] ?? ["0", 0];
const wordCounts = items.map((item) => item.words);
const dominantParagraphShare = items.length ? dominantParagraphEntry[1] / items.length : 0;

const report = {
  generatedAt: new Date().toISOString(),
  purpose: "Internal voice and structural-variety baseline; this report is not public article content.",
  targets: {
    breakingNewsMinimumWords: 280,
    standardNewsTypicalRange: "450–750",
    explainerMinimumWords: 500,
    analysisMinimumWords: 650,
    analysisMinimumParagraphs: 8,
    fixedParagraphTemplateProhibited: true,
    publisherAttributionMaximumPerArticle: 1,
  },
  summary: {
    publishedArticles: items.length,
    wordCount: {
      minimum: Math.min(...wordCounts),
      maximum: Math.max(...wordCounts),
      median: round(median(wordCounts)),
      average: round(mean(wordCounts)),
    },
    paragraphDistribution,
    dominantParagraphCount: Number(dominantParagraphEntry[0]),
    dominantParagraphShare: round(dominantParagraphShare, 3),
    uniformStructureWarning: dominantParagraphShare >= 0.45,
    exactSixParagraphArticles: items.filter((item) => item.paragraphs === 6).length,
    analysisBelowTarget: items.filter((item) => item.kind === "analysis" && item.words < 650).length,
    articlesWithStyleFlags: items.filter((item) => item.flags.length).length,
  },
  flagged: items.filter((item) => item.flags.length).sort((a, b) => b.flags.length - a.flags.length),
  clean: items.filter((item) => !item.flags.length),
};

await writeFile(path.join(root, "data/style-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report.summary)}\n`);
