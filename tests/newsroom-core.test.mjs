import test from "node:test";
import assert from "node:assert/strict";

import {
  decodeHtml,
  extractArticleText,
  extractFeedLinks,
  extractLinks,
  extractMetadata,
  extractOneHomepageLinks,
  isDuplicate,
  parseRobots,
  responseText,
  slugify,
  titleSimilarity,
} from "../scripts/newsroom-core.mjs";

test("decodes Hebrew metadata and extracts canonical source fields", () => {
  const html = `<!doctype html><html><head>
    <meta property="og:title" content="מכבי ת&quot;א ניצחה &amp; עלתה">
    <meta property="og:description" content="תיאור קצר">
    <meta property="article:published_time" content="2026-07-14T10:00:00+03:00">
    <link rel="canonical" href="/item/123">
  </head><body></body></html>`;
  const result = extractMetadata(html, "https://sports.example.co.il/sport");
  assert.equal(result.title, 'מכבי ת"א ניצחה & עלתה');
  assert.equal(result.url, "https://sports.example.co.il/item/123");
  assert.equal(result.publishedAt, "2026-07-14T10:00:00+03:00");
});

test("prefers a complete title when a publisher truncates its social tag", () => {
  const html = `<head><meta property="og:title" content="ארבעת שחקני בית"><meta name="title" content="ארבעת שחקני ביתר שעודכנו: אתם לא בתכניות"><title>ארבעת שחקני ביתר שעודכנו: אתם לא בתכניות - ערוץ הספורט</title></head>`;
  assert.equal(
    extractMetadata(html, "https://sports.example/article/1").title,
    "ארבעת שחקני ביתר שעודכנו: אתם לא בתכניות - ערוץ הספורט",
  );
});

test("extracts only same-site article links matching configured hints", () => {
  const html = `
    <a href="/item/123">כותרת ספורט חשובה מאוד</a>
    <a href="https://ads.example.com/item/4">advertisement elsewhere</a>
    <a href="/weather/2">not a sports article</a>`;
  assert.deepEqual(extractLinks(html, "https://news.example.com/", ["/item/"]), [
    { url: "https://news.example.com/item/123", anchor: "כותרת ספורט חשובה מאוד" },
  ]);
});

test("accepts publisher subdomains and reads news sitemaps", () => {
  const html = `<a href="https://sites.one.co.il/Mobile/Article/123.html">כותרת חדשות ספורט עדכנית</a>`;
  assert.equal(extractLinks(html, "https://www.one.co.il/", ["/Mobile/Article/"], ["sites.one.co.il"]).length, 1);
  const xml = `<urlset><url><loc>https://sports.example.co.il/item/9</loc><lastmod>2026-07-14T12:00:00+03:00</lastmod><news:news><news:title><![CDATA[כותרת חדשה]]></news:title></news:news></url></urlset>`;
  assert.deepEqual(extractFeedLinks(xml, "https://sports.example.co.il/sitemap.xml"), [
    { url: "https://sports.example.co.il/item/9", anchor: "כותרת חדשה", publishedAt: "2026-07-14T12:00:00+03:00", image: "" },
  ]);
});

test("keeps RSS publication dates and enclosure images for client-rendered articles", () => {
  const xml = `<rss><channel><item><title>חדשות חשובות</title><link>https://one.example/Article/1</link><pubDate>Tue, 14 Jul 2026 12:00:00 +0300</pubDate><enclosure url="https://images.example/1.webp" type="image/webp" /></item></channel></rss>`;
  assert.deepEqual(extractFeedLinks(xml, "https://one.example/rss"), [{
    url: "https://one.example/Article/1",
    anchor: "חדשות חשובות",
    publishedAt: "Tue, 14 Jul 2026 12:00:00 +0300",
    image: "https://images.example/1.webp",
  }]);
});

test("extracts non-ad news items from ONE homepage JSON", () => {
  const payload = { Data: { Articles: { Categories: [{ Items: [
    { ID: 22, Title: { Main: "כותרת חדשות ראשית" } },
    { ID: 23, Title: { Main: "שידור חי" }, IsLive: true },
    { ID: 24, Title: { Main: "תוכן פרסומי" }, Meta: { ONE: { IsAd: true } } },
  ] }] } } };
  assert.deepEqual(extractOneHomepageLinks(payload), [
    { url: "https://www.one.co.il/Article/22.html", anchor: "כותרת חדשות ראשית" },
  ]);
});

test("extracts an article body without scripts", () => {
  const html = `<article><p>First paragraph.</p><script>bad()</script><p>Second paragraph.</p></article>`;
  const text = extractArticleText(html);
  assert.match(text, /First paragraph/);
  assert.match(text, /Second paragraph/);
  assert.doesNotMatch(text, /bad/);
});

test("detects title duplicates without depending on punctuation", () => {
  const articles = [{ title: "Maccabi’s new attendance rule changes matchday", source: { url: "https://one.example/1" } }];
  assert.ok(titleSimilarity("Maccabi new attendance rule changes matchday", articles[0].title) > 0.8);
  assert.equal(isDuplicate({ title: "Maccabi new attendance rule changes matchday", url: "https://other.example/2" }, articles), true);
  assert.equal(isDuplicate({ title: "Tour mountain stage reshapes yellow jersey race", url: "https://other.example/3" }, articles), false);
});

test("merges different editorial angles that share a canonical event key", () => {
  const articles = [{
    title: "Evidence questions reshape the Ironi Tiberias investigation",
    dedupeKey: "football ironi tiberias infusion investigation july 2026",
    source: { url: "https://sport5.example/tiberias" },
  }];
  assert.equal(isDuplicate({
    title: "Five Tiberias players could be cleared",
    dedupeKey: "football ironi tiberias infusion investigation july 2026",
    url: "https://walla.example/tiberias",
  }, articles), true);
  assert.equal(isDuplicate({
    title: "Tiberias sign a new centre-forward",
    dedupeKey: "football ironi tiberias centre forward signing july 2026",
    url: "https://one.example/tiberias-signing",
  }, articles), false);
});

test("honours the most specific robots rule", () => {
  const robots = `User-agent: *\nDisallow: /private\nAllow: /private/public\nDisallow: *?tracking=*\n`;
  assert.equal(parseRobots(robots, "https://example.com/private/story"), false);
  assert.equal(parseRobots(robots, "https://example.com/private/public/story"), true);
  assert.equal(parseRobots(robots, "https://example.com/sport"), true);
  assert.equal(parseRobots(robots, "https://example.com/sport?tracking=1"), false);
});

test("accepts compact user-agent syntax used by publisher robots files", () => {
  const robots = "User-agent:*\nAllow: /\nDisallow: /HTML/Articles/*\n";
  assert.equal(parseRobots(robots, "https://sports.example/sitemap/articles/news-sitemap.xml"), true);
  assert.equal(parseRobots(robots, "https://sports.example/HTML/Articles/old"), false);
});

test("extracts Responses API output text", () => {
  assert.equal(responseText({ output: [{ content: [{ type: "output_text", text: "{\"ok\":true}" }] }] }), '{"ok":true}');
});

test("creates readable English slugs and decodes common entities", () => {
  assert.equal(slugify("World Cup: The pressure points"), "world-cup-the-pressure-points");
  assert.equal(decodeHtml("one&nbsp;&ndash;&nbsp;two"), "one – two");
});
