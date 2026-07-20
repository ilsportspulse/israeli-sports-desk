import Link from "next/link";

import { getCurrentAdmin } from "@/lib/admin/auth";
import { getAuditLog } from "@/lib/admin/audit";
import { countByStatus, getFacets, listArticles } from "@/lib/admin/store";
import { getNewsroomStatus } from "@/lib/newsroom-status";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default async function AdminDashboard() {
  const session = getCurrentAdmin();
  const [counts, facets, recent, audit, newsroom] = await Promise.all([
    countByStatus().catch(() => ({ published: 0, review: 0, total: 0 })),
    getFacets().catch(() => ({ categories: [], desks: [] })),
    listArticles({ status: "all" }).then((a) => a.slice(0, 6)).catch(() => []),
    getAuditLog(8).catch(() => []),
    getNewsroomStatus().catch(() => null),
  ]);

  const cards = [
    { n: counts.published, l: "Published", ic: "✓", bg: "#e4f4ec", fg: "#157a4b", href: "/admin/articles?status=published" },
    { n: counts.review, l: "In review", ic: "◷", bg: "#fdf1dc", fg: "#9a6b04", href: "/admin/review" },
    { n: counts.total, l: "Total stories", ic: "▤", bg: "#eaf0ff", fg: "#1748c0", href: "/admin/articles" },
    { n: facets.categories.length, l: "Categories", ic: "❏", bg: "#eef0ec", fg: "#5c6472", href: "/admin/articles" },
  ];

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Welcome back{session ? `, ${session.sub}` : ""} — here is your newsroom at a glance.</div>
        </div>
        <div className="spacer" />
        <Link href="/admin/articles/new" className="btn primary">+ New article</Link>
      </header>

      <div className="content">
        <div className="grid cols-4" style={{ marginBottom: 20 }}>
          {cards.map((c) => (
            <Link key={c.l} href={c.href} className="card stat" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="ic-badge" style={{ background: c.bg, color: c.fg }}>{c.ic}</div>
              <div className="n">{c.n}</div>
              <div className="l">{c.l}</div>
            </Link>
          ))}
        </div>

        <div className="grid cols-2" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          <div className="card">
            <h2>Recent stories</h2>
            {recent.length === 0 ? (
              <div className="empty">No stories yet.</div>
            ) : (
              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <tbody>
                    {recent.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Link href={`/admin/articles/${a.id}`} className="row-title">{a.title}</Link>
                          <div className="row-meta">{a.category} · {timeAgo(a.publishedAt)}</div>
                        </td>
                        <td style={{ textAlign: "right", width: 96 }}>
                          <span className={`badge ${(a.status ?? "published") === "review" ? "review" : "published"}`}>
                            {(a.status ?? "published") === "review" ? "Review" : "Published"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <Link href="/admin/articles" className="a plain" style={{ color: "var(--a-blue)", textDecoration: "none", fontSize: 13 }}>
                View all articles →
              </Link>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <h2>AI newsroom</h2>
              {newsroom && newsroom.checkedAt ? (
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--a-muted)" }}>
                  <div><b style={{ color: "var(--a-ink)" }}>{newsroom.candidates}</b> candidates last scan</div>
                  <div>
                    Feeds:{" "}
                    <span className={`badge ${newsroom.primaryFeedsHealthy ? "published" : "review"}`}>
                      {newsroom.primaryFeedsHealthy ? "healthy" : "check"}
                    </span>
                    {newsroom.errors > 0 && <span style={{ marginLeft: 6 }}>· {newsroom.errors} errors</span>}
                  </div>
                  <div>Updated {timeAgo(newsroom.checkedAt)}</div>
                </div>
              ) : (
                <div className="hint">No newsroom report yet. The cloud cycle runs hourly.</div>
              )}
              <div style={{ marginTop: 12 }}>
                <span className="badge neutral">Controls arrive in the Automation module</span>
              </div>
            </div>

            <div className="card">
              <h2>Recent activity</h2>
              {audit.length === 0 ? (
                <div className="hint">No activity logged yet.</div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                  {audit.map((e, i) => (
                    <li key={i} style={{ fontSize: 12.5, display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span><b>{e.actor}</b> · {e.summary || e.action}</span>
                      <span style={{ color: "var(--a-muted)", whiteSpace: "nowrap" }}>{timeAgo(e.ts)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
