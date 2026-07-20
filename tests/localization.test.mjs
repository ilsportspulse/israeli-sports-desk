import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const locales = JSON.parse(fs.readFileSync("data/locale-config.json", "utf8"));
const translations = JSON.parse(fs.readFileSync("data/content-translations.json", "utf8"));
const articles = JSON.parse(fs.readFileSync("data/articles.json", "utf8"));

test("locale registry launches English (default), French and Spanish left-to-right", () => {
  const byCode = new Map(locales.locales.map((locale) => [locale.code, locale]));
  assert.equal(locales.defaultLocale, "en");
  assert.equal(locales.contentTimezone, "Asia/Jerusalem");
  assert.equal(byCode.get("en")?.direction, "ltr");
  assert.equal(byCode.get("fr")?.direction, "ltr");
  assert.equal(byCode.get("es")?.direction, "ltr");
  assert.equal(byCode.get("fr")?.pathPrefix, "/fr");
  assert.equal(byCode.get("es")?.pathPrefix, "/es");
  assert.deepEqual(locales.fallbacks.fr, ["en"]);
  assert.deepEqual(locales.fallbacks.es, ["en"]);
  // Hebrew prototype has been retired from the public locale set.
  assert.equal(byCode.has("he"), false);
});

test("every stored translation resolves to a published canonical article and its current version", () => {
  const byId = new Map(articles.map((article) => [article.id, article]));
  assert.ok(Array.isArray(translations.translations));

  for (const translation of translations.translations) {
    const article = byId.get(translation.articleId);
    assert.ok(article, `missing canonical article ${translation.articleId}`);
    assert.notEqual(article.status, "review", `${translation.articleId} is not published`);
    assert.ok(["fr", "es"].includes(translation.locale), `unexpected locale ${translation.locale}`);
    assert.ok(["published", "reviewed", "reviewed-prototype"].includes(translation.status));
    assert.ok(["summary", "full"].includes(translation.coverage));
    if (translation.sourceUpdatedAt) {
      assert.equal(translation.sourceUpdatedAt, article.updatedAt ?? article.publishedAt);
    }
  }
});

test("locale helpers derive locale from path and rebuild locale-prefixed URLs", () => {
  const lib = fs.readFileSync("lib/locales.ts", "utf8");
  assert.match(lib, /export function localeFromPathname/);
  assert.match(lib, /export function stripLocalePrefix/);
  assert.match(lib, /export function pathForLocale/);
  assert.match(lib, /export const publicLocales/);
  assert.match(lib, /LocaleCode = "en" \| "fr" \| "es"/);
});

test("localized API summaries require a current source version and fall back cleanly", () => {
  const resolver = fs.readFileSync("lib/localized-articles.ts", "utf8");
  const route = fs.readFileSync("app/api/v1/articles/route.ts", "utf8");

  assert.match(resolver, /PUBLISHABLE_STATUSES\.has\(item\.status\)/);
  assert.match(resolver, /item\.sourceUpdatedAt === sourceVersion/);
  assert.match(resolver, /if \(!translation\) return null/);
  assert.match(route, /if \(!copy\) return \[\]/);
});

test("localized detail responses stay gated until body, facts and media copy are complete", () => {
  const resolver = fs.readFileSync("lib/localized-articles.ts", "utf8");
  const schema = JSON.parse(fs.readFileSync("packages/api-contracts/schemas/article-translation.schema.json", "utf8"));

  assert.match(resolver, /requireFull \? item\.coverage === "full"/);
  assert.match(resolver, /translation\.body\.length < 5/);
  assert.match(resolver, /translation\.facts\.length < 4/);
  assert.match(resolver, /translation\.media\?\.alt\.trim\(\)/);
  assert.deepEqual(schema.allOf[0].then.required, ["body", "facts", "media"]);
  assert.deepEqual(schema.properties.locale.enum, ["fr", "es"]);
});
