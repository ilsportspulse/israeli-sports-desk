import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const locales = JSON.parse(fs.readFileSync("data/locale-config.json", "utf8"));
const translations = JSON.parse(fs.readFileSync("data/content-translations.json", "utf8"));
const articles = JSON.parse(fs.readFileSync("data/articles.json", "utf8"));

test("locale registry keeps stable English and Hebrew directions", () => {
  const byCode = new Map(locales.locales.map((locale) => [locale.code, locale]));
  assert.equal(locales.defaultLocale, "en");
  assert.equal(locales.contentTimezone, "Asia/Jerusalem");
  assert.equal(byCode.get("en")?.direction, "ltr");
  assert.equal(byCode.get("he")?.direction, "rtl");
  assert.deepEqual(locales.fallbacks.he, ["en"]);
});

test("any retained Hebrew prototype records resolve to the current published article version", () => {
  const byId = new Map(articles.map((article) => [article.id, article]));
  assert.ok(Array.isArray(translations.translations));

  for (const translation of translations.translations) {
    const article = byId.get(translation.articleId);
    assert.ok(article, `missing canonical article ${translation.articleId}`);
    assert.notEqual(article.status, "review", `${translation.articleId} is not published`);
    assert.equal(translation.locale, "he");
    assert.equal(translation.status, "reviewed-prototype");
    assert.ok(["summary", "full"].includes(translation.coverage));
    assert.equal(translation.sourceUpdatedAt, article.updatedAt ?? article.publishedAt);
    assert.match(`${translation.title} ${translation.dek}`, /[\u0590-\u05ff]/);
  }
});

test("Hebrew route is semantic, keeps workflow private and uses logical RTL layout", () => {
  const page = fs.readFileSync("app/he-preview/page.tsx", "utf8");
  const css = fs.readFileSync("app/he-preview/hebrew-preview.module.css", "utf8");

  assert.match(page, /lang="he"/);
  assert.match(page, /dir="rtl"/);
  assert.doesNotMatch(page, /sourceUpdatedAt|reviewed-prototype|translation status/i);
  assert.match(css, /margin-inline|padding-inline|border-inline/);
  assert.doesNotMatch(css, /(margin|padding|border|inset)-(left|right)/);
  assert.match(css, /object-fit:\s*contain/);
});

test("localized API summaries require a reviewed current source version", () => {
  const resolver = fs.readFileSync("lib/localized-articles.ts", "utf8");
  const route = fs.readFileSync("app/api/v1/articles/route.ts", "utf8");

  assert.match(resolver, /item\.status === "reviewed-prototype"/);
  assert.match(resolver, /item\.sourceUpdatedAt === sourceVersion/);
  assert.match(resolver, /if \(!translation\) return null/);
  assert.match(route, /if \(!copy\) return \[\]/);
  assert.doesNotMatch(route, /sourceUpdatedAt|reviewed-prototype/);
});

test("Hebrew detail responses remain gated until body, facts and media copy are complete", () => {
  const resolver = fs.readFileSync("lib/localized-articles.ts", "utf8");
  const schema = JSON.parse(fs.readFileSync("packages/api-contracts/schemas/article-translation.schema.json", "utf8"));

  assert.equal(translations.translations.filter((item) => item.coverage === "full").length, 0);
  assert.match(resolver, /item\.coverage === "full"/);
  assert.match(resolver, /translation\.body\.length < 5/);
  assert.match(resolver, /translation\.facts\.length < 4/);
  assert.match(resolver, /translation\.media\?\.alt\.trim\(\)/);
  assert.deepEqual(schema.allOf[0].then.required, ["body", "facts", "media"]);
});
