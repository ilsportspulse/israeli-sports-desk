import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandLockup } from "@/components/brand";
import { BasketballCentre } from "@/components/basketball-centre";
import { BasketballScoreline } from "@/components/basketball-scoreline";
import { ExternalIcon, HomeIcon } from "@/components/icons";
import { MatchCentre } from "@/components/match-centre";
import { MatchScoreline } from "@/components/match-scoreline";
import { StoryVisual } from "@/components/story-visual";
import { siteConfig } from "@/config/site";
import { formatArticleDate, getArticle, getArticles } from "@/lib/articles";
import { getArticleImage } from "@/lib/media";
import { getBasketballWinnerStyle, getWinnerStyle } from "@/lib/match-style";

type ArticlePageProps = { params: { slug: string } | Promise<{ slug: string }> };

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const image = getArticleImage(article);
  return {
    title: article.title,
    description: article.dek,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.dek,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [{ url: image.src, alt: image.alt }],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const image = getArticleImage(article);

  const related = getArticles()
    .filter((candidate) => candidate.id !== article.id)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@type": article.kind === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.dek,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: siteConfig.name },
    image: `${siteConfig.siteUrl}${image.src}`,
  };

  return (
    <div className="article-page">
      <header className="article-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup">
            <BrandLockup />
          </Link>
          <div className="article-header-links">
            <Link href="/stories">All stories</Link>
            <Link href="/" className="article-back"><HomeIcon size={16} /> Back to the desk</Link>
          </div>
        </div>
      </header>

      <main>
        <article>
          <header className="article-hero">
            <div className="page-width article-hero-inner">
              <span className="article-category">{article.kind === "analysis" ? "Column · " : ""}{article.category}</span>
              {article.matchRecap ? <MatchScoreline recap={article.matchRecap} variant="article" /> : null}
              {article.basketballRecap ? <BasketballScoreline recap={article.basketballRecap} variant="article" /> : null}
              <h1 className={article.matchRecap || article.basketballRecap ? "winner-headline" : undefined} style={article.matchRecap ? getWinnerStyle(article.matchRecap) : article.basketballRecap ? getBasketballWinnerStyle(article.basketballRecap) : undefined}>{article.title}</h1>
              <p className="article-dek">{article.dek}</p>
              <div className="article-source-line">
                <span>{article.kind === "analysis" ? "ILSP Column · Sports Desk" : article.category === "From the Archive" ? "By the ILSP History Desk" : "By the ILSP Sports Desk"}</span>
                <i />
                <span>{formatArticleDate(article.publishedAt)}</span>
                {article.updatedAt && article.updatedAt !== article.publishedAt ? (
                  <>
                    <i />
                    <span>Updated {formatArticleDate(article.updatedAt)}</span>
                  </>
                ) : null}
              </div>
            </div>
          </header>

          <div className="page-width article-main">
            {article.officialSocialPost ? (
              <section className="article-social-feature" aria-label={article.officialSocialPost.title}>
                <div className="article-social-head">
                  <span>Official club reveal</span>
                  <strong>{article.officialSocialPost.title}</strong>
                  <small>Published by {article.officialSocialPost.account}</small>
                </div>
                <iframe
                  src={article.officialSocialPost.platform === "instagram"
                    ? `https://www.instagram.com/${article.officialSocialPost.url.includes("/reel/") ? "reel" : "p"}/${article.officialSocialPost.postId}/embed/`
                    : `https://platform.twitter.com/embed/Tweet.html?id=${article.officialSocialPost.postId}&theme=light&dnt=true`}
                  title={article.officialSocialPost.title}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
                <a href={article.officialSocialPost.url} target="_blank" rel="noreferrer">Open the official launch post <ExternalIcon size={13} /></a>
              </section>
            ) : (
              <>
                <figure className="article-feature-image">
                  <Image src={image.src} alt="" fill priority unoptimized={image.src.endsWith(".svg")} aria-hidden="true" className="article-image-backdrop" sizes="(max-width: 1100px) 100vw, 1080px" />
                  <Image src={image.src} alt={image.alt} fill priority unoptimized={image.src.endsWith(".svg")} className="article-image-full" sizes="(max-width: 1100px) 100vw, 1080px" />
                </figure>
                <div className="article-image-credit">
                  <span>{image.caption}</span>
                  <span>
                    {image.license === "Original editorial artwork" ? "Visual: " : "Photo: "}<a href={image.creditUrl} target="_blank" rel="noreferrer">{image.credit}</a>
                    {" · "}<a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a>
                  </span>
                </div>
              </>
            )}

            <div className="article-layout">
              <div className="article-body">
                {article.video ? (
                  <section className="article-video">
                    <div className="article-video-head"><span>Watch the archive</span><strong>{article.video.title}</strong><small>Uploaded by {article.video.channel}</small></div>
                    <div className="article-video-frame">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${article.video.youtubeId}`}
                        title={article.video.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                    <a href={article.video.sourceUrl} target="_blank" rel="noreferrer">Open on YouTube <ExternalIcon size={13} /></a>
                  </section>
                ) : null}
                {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>

              <aside className="article-aside">
                <section className="fact-card">
                  <span className="eyebrow">At a glance</span>
                  <h2>Key details</h2>
                  <ul>{article.facts.map((fact, index) => <li key={fact}><span>{index + 1}</span>{fact}</li>)}</ul>
                </section>
              </aside>
            </div>
            {article.matchRecap ? <MatchCentre recap={article.matchRecap} /> : null}
            {article.basketballRecap ? <BasketballCentre recap={article.basketballRecap} /> : null}
          </div>
        </article>

        <section className="page-width related-section">
          <div className="section-heading"><div><span className="eyebrow">Continue reading</span><h2>From the desk</h2></div></div>
          <div className="related-grid">
            {related.map((item) => (
              <Link key={item.id} href={`/article/${item.slug}`} className="related-card">
                <StoryVisual theme={item.theme} label={item.category} image={getArticleImage(item)} />
                <div><span className="eyebrow">{item.category}</span><h3>{item.title}</h3><p>{item.dek}</p></div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}
