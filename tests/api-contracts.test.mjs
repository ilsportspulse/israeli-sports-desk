import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const readJson = (path) => JSON.parse(fs.readFileSync(path, "utf8"));

function assertRequired(schema, value) {
  for (const key of schema.required ?? []) assert.ok(key in value, `${schema.title}: missing ${key}`);
}

test("shared article and score fixtures satisfy version-one required fields", () => {
  const articleSchema = readJson("packages/api-contracts/schemas/article-summary.schema.json");
  const articleDetailSchema = readJson("packages/api-contracts/schemas/article-detail.schema.json");
  const translationSchema = readJson("packages/api-contracts/schemas/article-translation.schema.json");
  const scoreSchema = readJson("packages/api-contracts/schemas/score-event.schema.json");
  const article = readJson("packages/api-contracts/fixtures/article-summary.en.json");
  const footballArticle = readJson("packages/api-contracts/fixtures/article-detail.football.json");
  const basketballArticle = readJson("packages/api-contracts/fixtures/article-detail.basketball.json");
  const score = readJson("packages/api-contracts/fixtures/score-event.football.json");

  assertRequired(articleSchema, article);
  assert.equal(articleDetailSchema.allOf[0].$ref, "./article-summary.schema.json");
  assert.ok(translationSchema.required.includes("coverage"));
  assert.deepEqual(translationSchema.properties.coverage.enum, ["summary", "full"]);
  assert.deepEqual(translationSchema.allOf[0].then.required, ["body", "facts", "media"]);
  assertRequired(scoreSchema, score);
  assert.equal(article.schemaVersion, "1.0");
  assert.equal(article.status, "published");
  assert.ok(articleDetailSchema.allOf[1].properties.matchRecap, "article detail schema has no football recap contract");
  assert.equal(footballArticle.matchRecap.status, "FT");
  assert.equal(footballArticle.matchRecap.home.lineup.length, 11);
  assert.equal(footballArticle.matchRecap.away.lineup.length, 11);
  assert.equal(footballArticle.matchRecap.attendance, 14299);
  assert.deepEqual([footballArticle.matchRecap.home.score, footballArticle.matchRecap.away.score], [1, 3]);
  assert.ok(footballArticle.matchRecap.events.some((event) => event.type === "goal"));
  assert.ok(footballArticle.matchRecap.events.some((event) => event.type === "second-yellow"));
  assert.ok(articleDetailSchema.allOf[1].properties.basketballRecap, "article detail schema has no basketball recap contract");
  assert.equal(basketballArticle.basketballRecap.status, "FT");
  assert.equal(basketballArticle.basketballRecap.home.quarters.reduce((total, value) => total + value, 0), basketballArticle.basketballRecap.home.score);
  assert.equal(basketballArticle.basketballRecap.away.quarters.reduce((total, value) => total + value, 0), basketballArticle.basketballRecap.away.score);
  assert.match(article.media.src, /^\/media\//);
  assert.equal(score.schemaVersion, "1.0");
  assert.ok(["scheduled", "live", "finished"].includes(score.status));
});

test("versioned read-only routes keep internal editorial fields outside the contract", () => {
  const articlesRoute = fs.readFileSync("app/api/v1/articles/route.ts", "utf8");
  const articleDetailRoute = fs.readFileSync("app/api/v1/articles/[slug]/route.ts", "utf8");
  const configRoute = fs.readFileSync("app/api/v1/config/route.ts", "utf8");
  const scoresRoute = fs.readFileSync("app/api/v1/scores/route.ts", "utf8");

  assert.match(articlesRoute, /schemaVersion:\s*"1\.0"/);
  assert.match(articlesRoute, /getPublicArticleSummaries/);
  assert.match(articlesRoute, /getLocalizedArticleSummaryCopy/);
  assert.match(articlesRoute, /searchParams\.get\("locale"\)/);
  assert.match(articlesRoute, /flatMap/);
  assert.doesNotMatch(articlesRoute, /aiDisclosure|reviewReasons|verificationSources|dedupeKey/);
  assert.match(articleDetailRoute, /toPublicArticle/);
  assert.match(articleDetailRoute, /matchRecap/);
  assert.match(articleDetailRoute, /basketballRecap/);
  assert.doesNotMatch(articleDetailRoute, /aiDisclosure|reviewReasons|verificationSources|dedupeKey/);
  assert.match(scoresRoute, /score-event\.football\.json/);
  assert.match(configRoute, /publicLaunchLocales:\s*active/);
  assert.match(configRoute, /prototypeLocales/);
  assert.match(configRoute, /prototypeLocalesPubliclySelectable:\s*false/);
  assert.match(configRoute, /notifications:\s*false/);
});

test("mobile proof is read-only, credential-free and preserves full image frames", () => {
  const mobileSources = [
    "prototypes/mobile/app/index.tsx",
    "prototypes/mobile/app/article/[slug].tsx",
    "prototypes/mobile/src/api.ts",
    "prototypes/mobile/src/header.tsx",
    "prototypes/mobile/src/locale.tsx",
  ];
  const app = mobileSources.map((path) => fs.readFileSync(path, "utf8")).join("\n");
  assert.match(app, /\/api\/v1\/articles/);
  assert.match(app, /\/api\/v1\/scores/);
  assert.doesNotMatch(app, /method:\s*["'](?:POST|PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(app, /api[_-]?key|secret|token/i);
  assert.match(app, /resizeMode="contain"/);
  assert.match(app, /matchRecap/);
  assert.match(app, /Starting line-ups/);
  assert.match(app, /attendance\.toLocaleString/);
  assert.match(app, /Attendance not published/);
  assert.match(app, /Referee \{article\.matchRecap\.referee\}/);
  assert.match(app, /basketballRecap/);
  assert.match(app, /locale === "he"/);
  assert.match(app, /EXPO_PUBLIC_ENABLE_HEBREW_PROTOTYPE/);
  assert.match(app, /__DEV__/);
  assert.match(app, /canPreviewPrototypeLocale \?/);
  assert.match(app, /articles\?locale=\$\{locale\}/);
  assert.match(app, /Full article in English/);
  assert.match(app, /writingDirection/);
  assert.match(app, /router\.push/);
  assert.match(app, /AsyncStorage\.getItem/);
  assert.match(app, /AsyncStorage\.setItem/);
  assert.ok(fs.existsSync("prototypes/mobile/package.json"));
  assert.ok(fs.existsSync("prototypes/mobile/app.json"));
  assert.equal(readJson("prototypes/mobile/package.json").main, "expo-router/entry");
});
