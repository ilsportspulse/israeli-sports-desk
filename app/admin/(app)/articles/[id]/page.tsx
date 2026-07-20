import Link from "next/link";

import { ArticleEditor } from "@/components/admin/article-editor";
import { getArticleById } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticleById(params.id);

  if (!article) {
    return (
      <>
        <header className="topbar"><h1>Article not found</h1></header>
        <div className="content">
          <div className="card"><div className="empty">
            No article with id <code>{params.id}</code>. <Link href="/admin/articles" className="a plain" style={{ color: "var(--a-blue)" }}>Back to articles</Link>
          </div></div>
        </div>
      </>
    );
  }

  return <ArticleEditor initial={article} mode="edit" />;
}
