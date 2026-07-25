import { BrandLockup } from "@/components/brand";
import { ArrowIcon, HomeIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedLink as Link } from "@/components/localized-link";
import { StoryVisual } from "@/components/story-visual";
import { formatArticleDate } from "@/lib/articles";
import { translator } from "@/lib/i18n/ui";
import { defaultLocale, type LocaleCode } from "@/lib/locales";
import { getArticlePhoto } from "@/lib/media";
import type { PublicArticleSummary } from "@/lib/types";

type StoryIndexProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  articles: PublicArticleSummary[];
  locale?: LocaleCode;
};

export function StoryIndex({ eyebrow, title, introduction, articles, locale = defaultLocale }: StoryIndexProps) {
  const tr = translator(locale);
  return (
    <div className="story-index-page">
      <header className="article-header story-index-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup" aria-label={`${"Israel Sports Pulse"} — ${tr("nav.home")}`}>
            <BrandLockup />
          </Link>
          <nav className="story-index-nav" aria-label={tr("aria.storyArchive")}>
            <Link href="/stories">{tr("nav.allStories")}</Link>
            <Link href="/archive">{tr("nav.archive")}</Link>
            <Link href="/columns">{tr("nav.columns")}</Link>
            <Link href="/scores">{tr("nav.matchCenter")}</Link>
          </nav>
          <div className="story-index-nav-actions">
            <LanguageSwitcher label={tr("label.language")} />
            <Link href="/" className="article-back"><HomeIcon size={16} /> {tr("label.backToDesk")}</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="story-index-hero">
          <div className="page-width">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{introduction}</p>
            <strong>{articles.length} {articles.length === 1 ? tr("label.story") : tr("label.stories")}</strong>
          </div>
        </section>

        <section className="page-width story-index-list" aria-label={title}>
          {articles.map((article) => (
            <Link key={article.id} href={`/article/${article.slug}`} className="story-index-card">
              <StoryVisual theme={article.theme} label={article.category} image={getArticlePhoto(article)} />
              <div className="story-index-copy">
                <div className="story-index-meta">
                  <span>{article.category}</span>
                  <span>{article.kind === "analysis" ? tr("label.column") : article.kind}</span>
                  <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt, true, locale)}</time>
                </div>
                <h2>{article.title}</h2>
                <p>{article.dek}</p>
                <span className="story-index-read">{tr("action.readStory")} <ArrowIcon size={17} /></span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
