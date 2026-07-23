import { siteConfig } from "@/config/site";
import { getArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

const BASE = siteConfig.siteUrl.replace(/\/$/, "");
const PUBLICATION = siteConfig.name;

// Google News sitemap: only articles from the last 48 hours (Google News's
// window), with <news:news> metadata. Google polls this far more often than the
// regular sitemap, so it is the fastest route into Google News and Top Stories.
// Referenced from robots.txt; also submit it in Search Console once.
function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function GET() {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const items = getArticles()
    .filter((a) => !a.seo?.noindex)
    .filter((a) => {
      const t = Date.parse(a.publishedAt ?? "");
      return Number.isFinite(t) && t >= cutoff;
    })
    .slice(0, 1000)
    .map((a) => {
      const loc = `${BASE}/article/${a.slug}`;
      const pub = new Date(a.publishedAt).toISOString();
      const title = xmlEscape(a.seo?.metaTitle || a.title);
      return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(PUBLICATION)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pub}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
