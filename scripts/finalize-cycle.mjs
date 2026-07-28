import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

const flags = Object.fromEntries(
  process.argv.slice(2).map((item) => {
    const [key, value = "true"] = item.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const [report, audit, styleAudit, articles, articleMedia] = await Promise.all([
  readJson("data/ingestion-report.json"),
  readJson("data/editorial-audit.json"),
  readJson("data/style-audit.json"),
  readJson("data/articles.json"),
  readJson("data/article-media.json"),
]);

const published = articles
  .filter((article) => article.status !== "review")
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
const now = Date.now();
const fortyEightHoursAgo = now - 48 * 60 * 60 * 1000;
const freshnessTime = (article) => new Date(article.featured ? article.updatedAt ?? article.publishedAt : article.publishedAt).getTime();
// Mirrors the homepage's editorial lead score (components/newsroom.tsx): clamped
// 0-100 news value, decay of 2 points/hour after a 6-hour grace, pin wins.
const leadScore = (article) => {
  const value = Math.min(100, Math.max(0, article.homepagePriority ?? 50));
  const ageHours = Math.max(0, (now - freshnessTime(article)) / 3_600_000);
  return (article.featured ? 1000 : 0) + value + (article.desk === "israel" ? 15 : 0) - Math.max(0, ageHours - 6) * 2;
};
const freshLeads = published
  .filter((article) => article.kind !== "analysis" && article.category !== "From the Archive" && (article.featured || freshnessTime(article) >= fortyEightHoursAgo))
  .sort((a, b) => leadScore(b) - leadScore(a) || freshnessTime(b) - freshnessTime(a));
const lead = freshLeads[0] ?? published.find((article) => article.kind !== "analysis" && article.category !== "From the Archive") ?? published[0];
const archive = published.find((article) => article.category === "From the Archive");
const international = published.find((article) => article.desk === "international" || article.desk === "world");
const ticker = published.filter((article) => article.category !== "From the Archive").slice(0, 8);
const promoted = Array.from(new Map([lead, archive, international, ...ticker].filter(Boolean).map((article) => [article.id, article])).values());
const missingMedia = promoted
  .filter((article) => !articleMedia[article.id] && !article.image)
  .map((article) => article.id);
const findings = [];
if (!freshLeads.length) findings.push("No published non-analysis report is recent enough for the lead window; the homepage is using the latest verified report rather than promoting an unverified candidate.");
if (missingMedia.length) findings.push(`${missingMedia.length} promoted item(s) rely on a generic fallback image and require media review.`);
if (!findings.length) findings.push("No automated homepage integrity fault detected in the promoted set.");

const drafted = report.drafted ?? [];
const editorialDisposition = report.cycleEditorialReview ?? null;
const discoverySummary = report.summary ?? {};
report.summary = {
  candidates: report.candidates?.length ?? 0,
  linksScanned: discoverySummary.linksScanned ?? report.sources?.reduce((total, source) => total + (source.linksScanned ?? 0), 0) ?? 0,
  previouslySeen: discoverySummary.previouslySeen ?? report.sources?.reduce((total, source) => total + (source.previouslySeen ?? 0), 0) ?? 0,
  stale: discoverySummary.stale ?? report.sources?.reduce((total, source) => total + (source.stale ?? 0), 0) ?? 0,
  existingStoryMatches: discoverySummary.existingStoryMatches ?? report.sources?.reduce((total, source) => total + (source.existingStoryMatches ?? 0), 0) ?? 0,
  published: editorialDisposition?.published ?? drafted.filter((item) => item.status === "published").length,
  reviewed: editorialDisposition?.reviewed ?? drafted.filter((item) => item.status === "review").length,
  merged: editorialDisposition?.merged ?? drafted.filter((item) => item.status === "duplicate-merged").length,
  rejected: editorialDisposition?.rejected ?? drafted.filter((item) => item.status === "rejected").length,
  errors: report.errors?.length ?? 0,
};
report.homepageAudit = {
  auditedAt: new Date().toISOString(),
  lead: lead ? { id: lead.id, title: lead.title, publishedAt: lead.publishedAt } : null,
  freshLeadCandidates: freshLeads.length,
  promotedItemsChecked: promoted.length,
  missingMedia,
  findings,
};
report.imageReplacements = Number(flags.imageReplacements ?? 0);
report.qualityGate = {
  publishedBefore: audit.summary?.publishedBefore ?? null,
  publishedAfter: audit.summary?.publishedAfter ?? null,
  blockedPublished: audit.summary?.blockedPublished ?? null,
  tests: flags.tests ?? "not-run",
  lint: flags.lint ?? "not-run",
  build: flags.build ?? "not-run",
  style: {
    uniformStructureWarning: styleAudit.summary?.uniformStructureWarning ?? null,
    exactSixParagraphArticles: styleAudit.summary?.exactSixParagraphArticles ?? null,
    analysisBelowTarget: styleAudit.summary?.analysisBelowTarget ?? null,
    articlesWithStyleFlags: styleAudit.summary?.articlesWithStyleFlags ?? null,
  },
};

await writeFile(path.join(root, "data/ingestion-report.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ summary: report.summary, homepageAudit: report.homepageAudit, qualityGate: report.qualityGate })}\n`);
