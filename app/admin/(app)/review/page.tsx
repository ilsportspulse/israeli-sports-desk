import Link from "next/link";

import { ArticleRowActions } from "@/components/admin/article-row-actions";
import { listArticles } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const articles = await listArticles({ status: "review" });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Review queue</h1>
          <div className="sub">{articles.length} stor{articles.length === 1 ? "y" : "ies"} awaiting a decision</div>
        </div>
      </header>

      <div className="content">
        {articles.length === 0 ? (
          <div className="card"><div className="empty">🎉 The review queue is empty. Nothing is waiting.</div></div>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {articles.map((a) => {
              const reasons = a.reviewReasons ?? [];
              return (
                <div key={a.id} className="card" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                      <span className="badge review">Review</span>
                      <span className="badge neutral">{a.category}</span>
                      {a.desk && <span className="badge desk">{a.desk}</span>}
                    </div>
                    <Link href={`/admin/articles/${a.id}`} className="row-title" style={{ fontSize: 15 }}>{a.title}</Link>
                    <p style={{ color: "var(--a-muted)", fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>{a.dek}</p>
                    {reasons.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--a-muted)" }}>
                        <b style={{ color: "var(--a-ink)" }}>Held because:</b> {reasons.join("; ")}
                      </div>
                    )}
                    <div className="row-meta" style={{ marginTop: 8 }}>/{a.slug} · source: {a.source?.name || "—"}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <ArticleRowActions id={a.id} status="review" compact />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
