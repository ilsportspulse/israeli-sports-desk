import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

import { titleSimilarity } from "../scripts/newsroom-core.mjs";

const articles = JSON.parse(await readFile(new URL("../data/articles.json", import.meta.url), "utf8"));
const articleMedia = JSON.parse(await readFile(new URL("../data/article-media.json", import.meta.url), "utf8"));
const dailyQuiz = JSON.parse(await readFile(new URL("../data/daily-quiz.json", import.meta.url), "utf8"));
const partnerProspects = JSON.parse(await readFile(new URL("../data/partner-prospects.json", import.meta.url), "utf8"));
const governanceActivation = JSON.parse(
  await readFile(new URL("../data/governance-activation-status.json", import.meta.url), "utf8"),
);
const scoreProviderCoverage = JSON.parse(
  await readFile(new URL("../data/score-provider-coverage.json", import.meta.url), "utf8"),
);
const published = articles.filter((article) => article.status !== "review");
const minimumWords = { news: 220, explainer: 200, analysis: 300 };
const internalWorkflowCopy = /verification panel|we have linked|no youtube|this report replaces|editorial trail|embedding permission|internal editorial|local product preview|feed checks|newsroom checked|30-minute cycle|every daily archive|cross-checked before publication|checked before publication/i;
const IsraeliPublisher = /\b(?:ONE|Sport5|Sport1|Walla Sport|Ynet Sport|Maariv)\b/;

function isSpecificResearchUrl(source) {
  try {
    const url = new URL(source.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    return url.search.length > 1 || pathParts.length >= 2;
  } catch {
    return false;
  }
}

test("published stories have unique ids, routes and canonical event keys", () => {
  for (const field of ["id", "slug"]) {
    const values = published.map((article) => article[field]);
    assert.equal(new Set(values).size, values.length, `duplicate ${field} found`);
  }

  const keys = published.map((article) => article.dedupeKey).filter(Boolean);
  assert.equal(new Set(keys).size, keys.length, "duplicate canonical event key found");
});

test("published English headlines do not contain near-duplicate stories", () => {
  for (let left = 0; left < published.length; left += 1) {
    for (let right = left + 1; right < published.length; right += 1) {
      const similarity = titleSimilarity(published[left].title, published[right].title);
      assert.ok(
        similarity < 0.72,
        `near-duplicate headlines: “${published[left].title}” and “${published[right].title}”`,
      );
    }
  }
});

test("every published story meets the professional reporting standard", () => {
  for (const article of published) {
    const words = article.body.join(" ").trim().split(/\s+/).filter(Boolean).length;
    const minimum = minimumWords[article.kind] ?? 220;
    const visibleCopy = [article.title, article.dek, ...article.body, ...article.facts].join(" ");

    assert.ok(words >= minimum, `${article.slug} has ${words}/${minimum} required words`);
    assert.ok(article.body.length >= 5, `${article.slug} has fewer than five paragraphs`);
    assert.ok(article.facts.length >= 4, `${article.slug} has fewer than four confirmed facts`);
    assert.ok(article.verificationSources?.length >= 1, `${article.slug} has no independent or authoritative verification`);
    assert.ok(
      article.verificationSources.some(isSpecificResearchUrl),
      `${article.slug} cites only generic homepages instead of claim-specific research`,
    );
    assert.doesNotMatch(visibleCopy, internalWorkflowCopy, `${article.slug} exposes internal editorial workflow`);
    // Source attribution ("ONE reports…", "according to Sport5…") is now standard,
    // responsible journalism for single-source aggregation, so it is no longer a
    // failure — it can appear anywhere in the copy. (We keep IsraeliPublisher imported
    // for the style audit's soft nudge on headlines.)
  }
});

test("every curated story image is licensed, real and unique", async () => {
  // Stories publish on their editorial merits; a specific photo is an enhancement,
  // not a gate (a story without one shows a clean category visual, never a wrong
  // photo). So we only validate the curated images that DO exist: each must be a
  // real, licensed, non-SVG file with an honest caption, and no two stories may
  // share the same file or source.
  const images = published
    .map((article) => ({ article, image: articleMedia[article.id] }))
    .filter((entry) => entry.image);

  for (const { article, image } of images) {
    assert.ok(image.creditUrl, `${article.slug} has no image source URL`);
    assert.ok(image.license, `${article.slug} has no image licence`);
    assert.doesNotMatch(image.src, /\.svg(?:$|\?)/i, `${article.slug} uses a text-led SVG instead of a photographic story image`);
    assert.doesNotMatch(
      image.caption ?? "",
      /does not depict|not shown|not represented as visible|illustrating.*not identified|generic image/i,
      `${article.slug} has a caption confirming an image mismatch`,
    );
  }

  await Promise.all(images.map(({ image }) => access(new URL(`../public${image.src}`, import.meta.url))));

  const srcs = images.map(({ image }) => image.src);
  const urls = images.map(({ image }) => image.creditUrl);
  assert.equal(new Set(srcs).size, srcs.length, "duplicate local story image found");
  assert.equal(new Set(urls).size, urls.length, "duplicate source image found");
});

test("published match recaps carry complete, interactive match data", () => {
  const recaps = published.filter((article) => article.matchRecap);
  assert.ok(recaps.some((article) => article.id === "live-20260714-super-cup-kanaan"), "the completed Super Cup report has no match centre");

  for (const article of recaps) {
    const recap = article.matchRecap;
    const goals = recap.events.filter((event) => event.type === "goal");
    assert.equal(recap.status, "FT", `${article.slug} is not marked full time`);
    assert.equal(recap.home.lineup.length, 11, `${article.slug} has an incomplete home starting XI`);
    assert.equal(recap.away.lineup.length, 11, `${article.slug} has an incomplete away starting XI`);
    assert.equal(goals.length, recap.home.score + recap.away.score, `${article.slug} goal timeline does not match the final score`);
    assert.ok(recap.events.every((event) => event.minute && event.player && event.team), `${article.slug} has an incomplete match event`);
    assert.ok(recap.venue && recap.city, `${article.slug} has no venue details`);
    assert.ok(recap.attendance > 0 || recap.attendanceNote, `${article.slug} has neither confirmed attendance nor an explicit unavailable marker`);
    assert.ok(recap.referee, `${article.slug} has no referee`);
    assert.ok(recap.home.logo && recap.away.logo, `${article.slug} has missing team marks`);
    if (recap.home.score !== recap.away.score) {
      const winner = recap.home.score > recap.away.score ? recap.home : recap.away;
      assert.ok(winner.colors?.primary, `${article.slug} has no winner-colour atmosphere accent`);
    }
  }
});

test("published basketball recaps carry complete, interactive box-score data", () => {
  const recaps = published.filter((article) => article.basketballRecap);
  assert.ok(recaps.some((article) => article.id === "live-20260717-israel-u20-italy-division-a"), "the completed U20 report has no basketball game centre");

  for (const article of recaps) {
    const recap = article.basketballRecap;
    assert.equal(recap.status, "FT", `${article.slug} is not marked full time`);
    assert.equal(recap.home.quarters.length, 4, `${article.slug} has an incomplete home quarter score`);
    assert.equal(recap.away.quarters.length, 4, `${article.slug} has an incomplete away quarter score`);
    assert.equal(recap.home.quarters.reduce((total, score) => total + score, 0), recap.home.score, `${article.slug} home quarters do not match the final score`);
    assert.equal(recap.away.quarters.reduce((total, score) => total + score, 0), recap.away.score, `${article.slug} away quarters do not match the final score`);
    assert.ok(recap.stats.length >= 4, `${article.slug} has fewer than four team comparisons`);
    assert.ok(recap.leaders.length >= 2, `${article.slug} has fewer than two game leaders`);
    assert.ok(recap.venue && recap.city, `${article.slug} has no venue details`);
    assert.ok(recap.attendance > 0 || recap.attendanceNote, `${article.slug} has neither confirmed attendance nor an explicit unavailable marker`);
    assert.ok(recap.officials.length >= 2, `${article.slug} has incomplete officials`);
    if (recap.home.score !== recap.away.score) {
      const winner = recap.home.score > recap.away.score ? recap.home : recap.away;
      assert.ok(winner.colors?.primary, `${article.slug} has no winner-colour atmosphere accent`);
    }
  }
});

test("the daily engagement package is complete and source-backed", () => {
  assert.match(dailyQuiz.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(dailyQuiz.questions.length, 5, "daily quiz must contain exactly five questions");
  assert.equal(new Set(dailyQuiz.questions.map((item) => item.question)).size, 5, "daily quiz contains a duplicate question");
  for (const item of dailyQuiz.questions) {
    assert.ok(item.answers.length >= 3, `${item.question} needs at least three choices`);
    assert.ok(item.correctIndex >= 0 && item.correctIndex < item.answers.length, `${item.question} has an invalid answer index`);
    assert.match(item.sourceUrl, /^https:\/\//, `${item.question} has no secure source link`);
  }
  const archive = published.find((article) => article.category === "From the Archive" && article.publishedAt.startsWith(dailyQuiz.date));
  assert.ok(archive, `no published archive feature accompanies the ${dailyQuiz.date} quiz`);
  assert.ok(archive.verificationSources?.length >= 2, `${archive.slug} needs multiple verification sources`);
});

test("the partner pipeline remains research-only until owner approval", () => {
  assert.ok(partnerProspects.length >= 8, "partner research needs a useful initial pipeline");
  assert.equal(new Set(partnerProspects.map((prospect) => prospect.id)).size, partnerProspects.length, "duplicate partner id found");

  for (const prospect of partnerProspects) {
    assert.match(prospect.routeUrl, /^https:\/\//, `${prospect.id} has no secure official route`);
    assert.match(prospect.evidenceUrl, /^https:\/\//, `${prospect.id} has no secure evidence URL`);
    assert.equal(prospect.ownerApprovalRequired, true, `${prospect.id} bypasses owner approval`);
    assert.doesNotMatch(prospect.status, /contacted|replied|meeting|proposal|legal|won/i, `${prospect.id} claims external activity that has not occurred`);
  }
});

test("public article surfaces do not expose internal newsroom metadata", async () => {
  const [apiRoute, homePage, newsroom, articlePage] = await Promise.all([
    readFile(new URL("../app/api/articles/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/newsroom.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/article/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(apiRoute, /getPublicArticles\(\)/, "public API bypasses its sanitised article projection");
  assert.match(homePage, /getPublicArticleSummaries\(\)/, "homepage serialises full internal article records");
  assert.doesNotMatch(newsroom, /article\.source/, "client newsroom receives internal source metadata");
  assert.doesNotMatch(articlePage, /article\.source/, "article HTML exposes internal source metadata");
  assert.doesNotMatch(articlePage, /AI[- ](?:assisted|generated|driven)/i, "article page publicly labels its production tooling");
});

test("the public founder story remains informative without naming or picturing the founder", async () => {
  const [aboutPage, newsroom] = await Promise.all([
    readFile(new URL("../app/about/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/newsroom.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(aboutPage, /born in Tel Aviv/i);
  assert.match(aboutPage, /Israeli mother and a Belgian father/i);
  assert.match(aboutPage, /more than a decade ago/i);
  assert.match(aboutPage, /Funding pays for editors and reporters/i);
  assert.doesNotMatch(aboutPage, /Patrick|<img|mailto:/i, "the public founder story exposes an identity, portrait or contact route");
  assert.match(newsroom, /href=["']\/about["']/, "the founder story is absent from the permanent site navigation");
});

test("governance policies are permanent, linked and commercially independent", async () => {
  const routes = [
    "../app/corrections/page.tsx",
    "../app/privacy/page.tsx",
    "../app/terms/page.tsx",
    "../app/commercial-independence/page.tsx",
  ];
  const [newsroom, ...policies] = await Promise.all([
    readFile(new URL("../components/newsroom.tsx", import.meta.url), "utf8"),
    ...routes.map((route) => readFile(new URL(route, import.meta.url), "utf8")),
  ]);

  for (const href of ["/corrections", "/privacy", "/terms", "/commercial-independence"]) {
    assert.match(newsroom, new RegExp(`href=[\"']${href}[\"']`), `${href} is not linked from the permanent footer`);
  }

  const commercialPolicy = policies.at(-1);
  assert.match(commercialPolicy, /cannot buy favourable coverage/i);
  assert.match(commercialPolicy, /Corrections and public-interest reporting cannot be delayed or blocked/i);
  assert.match(commercialPolicy, /does not convert surrounding newsroom coverage into sponsored content/i);
});

test("governance activation remains fail-closed until owner and professional gates pass", async () => {
  const [newsroom, checklist, ...policies] = await Promise.all([
    readFile(new URL("../components/newsroom.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/governance-launch-checklist.md", import.meta.url), "utf8"),
    ...governanceActivation.policyRoutes.map((item) =>
      readFile(new URL(`../${item.file}`, import.meta.url), "utf8"),
    ),
  ]);

  assert.equal(governanceActivation.policyRoutes.length, 4);
  assert.equal(governanceActivation.publicAddresses.length, 4);
  assert.equal(governanceActivation.launchPrerequisites.length, 7);
  assert.deepEqual(governanceActivation.externalActionsTaken, []);

  for (const item of governanceActivation.policyRoutes) {
    assert.equal(item.footerLinkVerified, true, `${item.route} footer verification is not recorded`);
    assert.match(newsroom, new RegExp(`href=["']${item.route}["']`), `${item.route} is absent from the footer`);
  }

  const policyCopy = policies.join("\n");
  for (const inbox of governanceActivation.publicAddresses) {
    assert.equal(inbox.activationStatus, "unverified-owner-controlled", `${inbox.address} is prematurely active`);
    assert.match(policyCopy, new RegExp(inbox.address.replace(".", "\\.")), `${inbox.address} is absent from policy copy`);
  }

  assert.match(checklist, /release rule is fail-closed/i);
  assert.ok(
    governanceActivation.launchPrerequisites.every((item) => item.status.startsWith("pending")),
    "a governance launch prerequisite was marked complete without owner evidence",
  );
});

test("score-provider planning remains complete and fail-closed before any trial or purchase", async () => {
  const maintenance = await readFile(
    new URL("../docs/score-provider-matrix-maintenance-check.md", import.meta.url),
    "utf8",
  );

  assert.equal(scoreProviderCoverage.providers.length, 6);
  assert.equal(scoreProviderCoverage.sports.length, 17);
  assert.equal(scoreProviderCoverage.acceptanceTests.length, 13);
  assert.equal(new Set(scoreProviderCoverage.acceptanceTests).size, 13, "duplicate provider acceptance check found");
  assert.ok(scoreProviderCoverage.sources.every((url) => url.startsWith("https://")));
  assert.deepEqual(scoreProviderCoverage.externalActionsTaken, []);
  assert.equal(scoreProviderCoverage.maintenanceReview.decisionChanged, false);
  assert.equal(scoreProviderCoverage.maintenanceReview.trialsOpened, false);
  assert.equal(scoreProviderCoverage.maintenanceReview.accountsCreated, false);
  assert.equal(scoreProviderCoverage.maintenanceReview.purchasesMade, false);
  assert.equal(scoreProviderCoverage.maintenanceReview.externalContactsMade, false);
  assert.equal(scoreProviderCoverage.claimFreshness.publicPricingRefreshedThisCycle, false);
  assert.equal(scoreProviderCoverage.claimFreshness.competitionCoverageRefreshedThisCycle, false);
  assert.match(scoreProviderCoverage.recommendedNextAction, /after owner approval/i);
  assert.match(maintenance, /release rule is unchanged/i);
  assert.match(maintenance, /No trial, account, licence request, contact or purchase was opened/i);
});
