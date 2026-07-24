import { siteConfig } from "@/config/site";
import { getArticles } from "@/lib/articles";

// Israel-only RSS feed for social auto-posting (e.g. dlvr.it → X). It carries just
// Israeli-desk stories, newest first, so a connected auto-poster tweets Israeli
// news exclusively — no filtering needed on their side.
export const dynamic = "force-dynamic";

const BASE = siteConfig.siteUrl.replace(/\/$/, "");

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const isIsraeli = (a: { desk?: string; category?: string }) =>
  a.desk === "israel" || /^israeli|israelis abroad/i.test(a.category ?? "");

export function GET() {
  const articles = getArticles()
    .filter((article) => !article.seo?.noindex)
    .filter(isIsraeli)
    .slice(0, 40);
  const lastBuild = new Date().toUTCString();

  const items = articles
    .map((article) => {
      const url = `${BASE}/article/${article.slug}`;
      const pubDate = new Date(article.publishedAt ?? Date.now()).toUTCString();
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(article.category ?? "Israeli Sport")}</category>
      <description>${escapeXml(article.dek ?? "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} — Israeli sport</title>
    <link>${BASE}</link>
    <atom:link href="${BASE}/feed-israel.xml" rel="self" type="application/rss+xml" />
    <description>Israeli sport news from ${escapeXml(siteConfig.name)}.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
