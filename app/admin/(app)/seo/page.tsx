import Link from "next/link";

import { siteConfig } from "@/config/site";
import { getSettings } from "@/lib/admin/settings";
import { listArticles } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const [settings, articles] = await Promise.all([getSettings(), listArticles({ status: "all" })]);

  const published = articles.filter((a) => (a.status ?? "published") === "published");
  const withMetaTitle = articles.filter((a) => a.seo?.metaTitle).length;
  const withMetaDesc = articles.filter((a) => a.seo?.metaDescription).length;
  const withKeyword = articles.filter((a) => a.seo?.focusKeyword).length;
  const noindexed = articles.filter((a) => a.seo?.noindex).length;

  const surfaces = [
    { label: "Sitemap", href: "/sitemap.xml" },
    { label: "Robots", href: "/robots.txt" },
    { label: "RSS / News feed", href: "/feed.xml" },
    { label: "AI llms.txt", href: "/llms.txt" },
    { label: "PWA manifest", href: "/manifest.webmanifest" },
  ];

  return (
    <>
      <header className="topbar">
        <div><h1>SEO</h1><div className="sub">Indexability, structured data & per-article coverage</div></div>
        <div className="spacer" />
        <Link href="/admin/settings" className="btn">Edit SEO defaults →</Link>
      </header>

      <div className="content">
        <div className="grid cols-4" style={{ marginBottom: 16 }}>
          <div className="card stat"><div className="ic-badge" style={{ background: settings.seo.indexable ? "#e4f4ec" : "#fdecec", color: settings.seo.indexable ? "#157a4b" : "#b3261e" }}>{settings.seo.indexable ? "✓" : "✕"}</div>
            <div className="n" style={{ fontSize: 18 }}>{settings.seo.indexable ? "Indexable" : "Noindex"}</div><div className="l">Global search visibility</div></div>
          <div className="card stat"><div className="ic-badge" style={{ background: "#eaf0ff", color: "#1748c0" }}>▤</div>
            <div className="n">{published.length}</div><div className="l">Published & indexable</div></div>
          <div className="card stat"><div className="ic-badge" style={{ background: "#fdf1dc", color: "#9a6b04" }}>⌁</div>
            <div className="n">{withMetaTitle + withMetaDesc}</div><div className="l">Custom meta overrides</div></div>
          <div className="card stat"><div className="ic-badge" style={{ background: "#eef0ec", color: "#5c6472" }}>◌</div>
            <div className="n">{noindexed}</div><div className="l">Hidden (noindex)</div></div>
        </div>

        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div className="card">
            <h2>Live SEO surfaces</h2>
            <div className="table-wrap" style={{ border: "none" }}><table>
              <tbody>{surfaces.map((s) => (
                <tr key={s.href}><td>{s.label}</td>
                  <td style={{ textAlign: "right" }}>
                    <a className="plain" href={`${base}${s.href}`} target="_blank" rel="noreferrer" style={{ color: "var(--a-blue)" }}>{s.href} ↗</a>
                  </td></tr>
              ))}</tbody>
            </table></div>
            <p className="hint" style={{ marginTop: 10 }}>Every article page ships NewsArticle + BreadcrumbList structured data and a canonical URL. Publishing pings IndexNow when configured.</p>
          </div>

          <div className="card">
            <h2>Per-article SEO coverage</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9, fontSize: 13 }}>
              <li style={{ display: "flex", justifyContent: "space-between" }}><span>Custom meta title</span><b>{withMetaTitle} / {articles.length}</b></li>
              <li style={{ display: "flex", justifyContent: "space-between" }}><span>Custom meta description</span><b>{withMetaDesc} / {articles.length}</b></li>
              <li style={{ display: "flex", justifyContent: "space-between" }}><span>Focus keyword set</span><b>{withKeyword} / {articles.length}</b></li>
              <li style={{ display: "flex", justifyContent: "space-between" }}><span>Canonical host</span><b>{settings.seo.canonicalHost}</b></li>
            </ul>
            <p className="hint" style={{ marginTop: 12 }}>Articles without overrides fall back to their title, dek and default OG image — every page always has valid SEO.</p>
          </div>
        </div>
      </div>
    </>
  );
}
