import Link from "next/link";

import { ArticleRowActions } from "@/components/admin/article-row-actions";
import { getFacets, listArticles, type ArticleFilter } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

type Search = { status?: string; desk?: string; category?: string; search?: string };

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function ArticlesPage({ searchParams }: { searchParams: Search }) {
  const filter: ArticleFilter = {
    status: (searchParams.status as ArticleFilter["status"]) || "all",
    desk: searchParams.desk || undefined,
    category: searchParams.category || undefined,
    search: searchParams.search || undefined,
  };
  const [articles, facets] = await Promise.all([listArticles(filter), getFacets()]);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Articles</h1>
          <div className="sub">{articles.length} stor{articles.length === 1 ? "y" : "ies"} shown</div>
        </div>
        <div className="spacer" />
        <Link href="/admin/articles/new" className="btn primary">+ New article</Link>
      </header>

      <div className="content">
        <form className="filters" method="GET">
          <div className="field search">
            <label htmlFor="search">Search</label>
            <input id="search" type="text" name="search" defaultValue={searchParams.search ?? ""} placeholder="Title, slug, id…" />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={filter.status}>
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="review">In review</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="desk">Desk</label>
            <select id="desk" name="desk" defaultValue={searchParams.desk ?? ""}>
              <option value="">All</option>
              {facets.desks.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={searchParams.category ?? ""}>
              <option value="">All</option>
              {facets.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button className="btn" type="submit">Apply</button>
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th style={{ width: 150 }}>Category</th>
                <th style={{ width: 90 }}>Status</th>
                <th style={{ width: 110 }}>Published</th>
                <th style={{ width: 260, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr><td colSpan={5}><div className="empty">No articles match these filters.</div></td></tr>
              ) : (
                articles.map((a) => {
                  const status = (a.status ?? "published") as "published" | "review";
                  return (
                    <tr key={a.id}>
                      <td>
                        <Link href={`/admin/articles/${a.id}`} className="row-title">{a.title}</Link>
                        <div className="row-meta">
                          /{a.slug}{a.desk ? <> · <span className="badge desk" style={{ padding: "1px 6px" }}>{a.desk}</span></> : null}
                        </div>
                      </td>
                      <td>{a.category}</td>
                      <td><span className={`badge ${status}`}>{status === "review" ? "Review" : "Published"}</span></td>
                      <td style={{ color: "var(--a-muted)", fontSize: 12.5 }}>{fmtDate(a.publishedAt)}</td>
                      <td><ArticleRowActions id={a.id} status={status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
