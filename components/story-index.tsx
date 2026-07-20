import Link from "next/link";

import { BrandLockup } from "@/components/brand";
import { ArrowIcon, HomeIcon } from "@/components/icons";
import { StoryVisual } from "@/components/story-visual";
import { formatArticleDate } from "@/lib/articles";
import { getArticleImage } from "@/lib/media";
import type { PublicArticleSummary } from "@/lib/types";

type StoryIndexProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  articles: PublicArticleSummary[];
};

export function StoryIndex({ eyebrow, title, introduction, articles }: StoryIndexProps) {
  return (
    <div className="story-index-page">
      <header className="article-header story-index-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup" aria-label="Israel Sports Pulse home">
            <BrandLockup />
          </Link>
          <nav className="story-index-nav" aria-label="Story archive">
            <Link href="/stories">All stories</Link>
            <Link href="/archive">Archive</Link>
            <Link href="/columns">Columns</Link>
            <Link href="/scores">Scores</Link>
          </nav>
          <Link href="/" className="article-back"><HomeIcon size={16} /> Back to the desk</Link>
        </div>
      </header>

      <main>
        <section className="story-index-hero">
          <div className="page-width">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{introduction}</p>
            <strong>{articles.length} {articles.length === 1 ? "story" : "stories"}</strong>
          </div>
        </section>

        <section className="page-width story-index-list" aria-label={title}>
          {articles.map((article) => (
            <Link key={article.id} href={`/article/${article.slug}`} className="story-index-card">
              <StoryVisual theme={article.theme} label={article.category} image={getArticleImage(article)} />
              <div className="story-index-copy">
                <div className="story-index-meta">
                  <span>{article.category}</span>
                  <span>{article.kind === "analysis" ? "Column" : article.kind}</span>
                  <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt, true)}</time>
                </div>
                <h2>{article.title}</h2>
                <p>{article.dek}</p>
                <span className="story-index-read">Read story <ArrowIcon size={17} /></span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
