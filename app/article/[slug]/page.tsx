import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";

import { getCorrectionsForArticle } from "@/lib/admin/corrections";
import { findRedirect } from "@/lib/admin/store";

import { BrandLockup } from "@/components/brand";
import { BasketballCentre } from "@/components/basketball-centre";
import { BasketballScoreline } from "@/components/basketball-scoreline";
import { ExternalIcon, HomeIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedLink as Link } from "@/components/localized-link";
import { MatchCentre } from "@/components/match-centre";
import { MatchScoreline } from "@/components/match-scoreline";
import { StoryVisual } from "@/components/story-visual";
import { siteConfig } from "@/config/site";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { formatArticleDate, getArticle, getArticleIncludingReview, getArticles } from "@/lib/articles";
import { getLocalizedArticleDetailCopy, getLocalizedArticleSummaryCopy } from "@/lib/localized-articles";
import { getArticleImage } from "@/lib/media";
import { getBasketballWinnerStyle, getWinnerStyle } from "@/lib/match-style";
import { defaultLocale, getLocaleDefinition, pathForLocale, publicLocales } from "@/lib/locales";
import { getRequestLocale } from "@/lib/request-locale";
import { translator } from "@/lib/i18n/ui";

type ArticlePageProps = { params: { slug: string } | Promise<{ slug: string }> };

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const locale = getRequestLocale();
  const image = getArticleImage(article);
  const seo = article.seo ?? {};
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const canonicalPath = `/article/${article.slug}`;
  // Per-locale canonical + hreflang map so each language is indexed on its own URL.
  const localeUrl = `${base}${pathForLocale(canonicalPath, locale)}`;
  const url = locale === defaultLocale ? (seo.canonical || `${base}${canonicalPath}`) : localeUrl;
  const languages: Record<string, string> = { "x-default": `${base}${canonicalPath}` };
  for (const def of publicLocales) {
    languages[def.bcp47] = `${base}${pathForLocale(canonicalPath, def.code)}`;
  }
  const localized = getLocalizedArticleDetailCopy(article, locale);
  const ogImg = seo.ogImage ? (seo.ogImage.startsWith("http") ? seo.ogImage : `${base}${seo.ogImage}`) : `${base}${image.src}`;
  const description = localized?.dek || seo.metaDescription || article.dek;
  const headline = localized?.title || seo.metaTitle || article.title;
  return {
    title: localized?.title ? { absolute: localized.title } : seo.metaTitle ? { absolute: seo.metaTitle } : article.title,
    description,
    keywords: seo.keywords && seo.keywords.length ? seo.keywords : undefined,
    alternates: { canonical: url, languages },
    robots: seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      locale: getLocaleDefinition(locale).bcp47.replace("-", "_"),
      url,
      title: headline,
      description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [{ url: ogImg, alt: localized?.media.alt || image.alt }],
    },
    twitter: { card: "summary_large_image", title: headline, description, images: [ogImg] },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  let article = getArticle(slug);
  // Backoffice preview: a signed-in admin session may view articles still in
  // review, exactly as they will render once published. Never for the public.
  let previewing = false;
  if (!article && getCurrentAdmin()) {
    const draft = getArticleIncludingReview(slug);
    if (draft) {
      article = draft;
      previewing = true;
    }
  }
  if (!article) {
    // Honour a backoffice slug-change redirect before 404ing so old URLs keep ranking.
    const redirect = await findRedirect(`/article/${slug}`);
    if (redirect) permanentRedirect(redirect.to);
    notFound();
  }
  const locale = getRequestLocale();
  const tr = translator(locale);
  const image = getArticleImage(article);
  const corrections = await getCorrectionsForArticle(article.id);

  // Localise the article. A full translation replaces every field; otherwise we
  // fall back to the English original and label it clearly for the reader.
  const localized = getLocalizedArticleDetailCopy(article, locale);
  const usingFallback = locale !== defaultLocale && !localized;
  const displayTitle = localized?.title ?? article.title;
  const displayDek = localized?.dek ?? article.dek;
  const displayCategory = localized?.category ?? article.category;
  const displayBody = localized?.body ?? article.body;
  const displayFacts = localized?.facts ?? article.facts;
  const displayImageAlt = localized?.media.alt ?? image.alt;
  const displayImageCaption = localized?.media.caption ?? image.caption;

  const related = getArticles()
    .filter((candidate) => candidate.id !== article.id)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3)
    .map((item) => {
      const copy = getLocalizedArticleSummaryCopy(item, locale);
      return copy ? { ...item, title: copy.title, dek: copy.dek, category: copy.category } : item;
    });
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const articleUrl = article.seo?.canonical || `${base}/article/${article.slug}`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": article.kind === "news" ? "NewsArticle" : "Article",
      headline: localized?.title || article.seo?.metaTitle || article.title,
      description: localized?.dek || article.seo?.metaDescription || article.dek,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt ?? article.publishedAt,
      inLanguage: getLocaleDefinition(locale).bcp47,
      mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
      author: { "@type": "Organization", name: siteConfig.name, url: base },
      publisher: {
        "@type": "NewsMediaOrganization",
        name: siteConfig.name,
        logo: { "@type": "ImageObject", url: `${base}/brand/ilsp-mark.svg` },
      },
      image: [`${base}${image.src}`],
      articleSection: article.category,
      keywords: article.seo?.keywords?.join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: article.category, item: `${base}/stories` },
        { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
      ],
    },
  ];

  return (
    <div className="article-page">
      {previewing && (
        <div style={{ background: "#b45309", color: "#fff", textAlign: "center", padding: "8px 16px", fontSize: 14, fontWeight: 600, position: "sticky", top: 0, zIndex: 50 }}>
          Preview — this article is in review and not visible to the public.{" "}
          <a href={`/admin/articles/${article.id}`} style={{ color: "#fff", textDecoration: "underline" }}>Back to editor</a>
        </div>
      )}
      <header className="article-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup">
            <BrandLockup />
          </Link>
          <div className="article-header-links">
            <Link href="/stories">{tr("nav.allStories")}</Link>
            <LanguageSwitcher label={tr("label.language")} />
            <Link href="/" className="article-back"><HomeIcon size={16} /> {tr("label.backHome")}</Link>
          </div>
        </div>
      </header>

      <main>
        <article>
          <header className="article-hero">
            <div className="page-width article-hero-inner">
              <span className="article-category">{article.kind === "analysis" ? "Column · " : ""}{displayCategory}</span>
              {article.matchRecap ? <MatchScoreline recap={article.matchRecap} variant="article" /> : null}
              {article.basketballRecap ? <BasketballScoreline recap={article.basketballRecap} variant="article" /> : null}
              <h1 className={article.matchRecap || article.basketballRecap ? "winner-headline" : undefined} style={article.matchRecap ? getWinnerStyle(article.matchRecap) : article.basketballRecap ? getBasketballWinnerStyle(article.basketballRecap) : undefined}>{displayTitle}</h1>
              <p className="article-dek">{displayDek}</p>
              <div className="article-source-line">
                <span>{article.kind === "analysis" ? tr("byline.column") : article.category === "From the Archive" ? tr("byline.historyDesk") : tr("byline.sportsDesk")}</span>
                <i />
                <span>{formatArticleDate(article.publishedAt)}</span>
                {article.updatedAt && article.updatedAt !== article.publishedAt ? (
                  <>
                    <i />
                    <span>{tr("label.updated")} {formatArticleDate(article.updatedAt)}</span>
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
                  <Image src={image.src} alt={displayImageAlt} fill priority unoptimized={image.src.endsWith(".svg")} className="article-image-full" sizes="(max-width: 1100px) 100vw, 1080px" />
                </figure>
                <div className="article-image-credit">
                  <span>{displayImageCaption}</span>
                  <span>
                    {image.license === "Original editorial artwork" ? "Visual: " : "Photo: "}<a href={image.creditUrl} target="_blank" rel="noreferrer">{image.credit}</a>
                    {" · "}<a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a>
                  </span>
                </div>
              </>
            )}

            <div className="article-layout">
              <div className="article-body">
                {usingFallback && (
                  <aside className="article-locale-note" lang={defaultLocale}>
                    {tr("label.machineTranslated")}
                  </aside>
                )}
                {corrections.length > 0 && (
                  <aside style={{ border: "1px solid #e2c98a", background: "#fdf6e6", borderRadius: 10, padding: "12px 16px", margin: "0 0 22px" }}>
                    <strong style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".05em" }}>{tr("label.corrections")}</strong>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                      {corrections.map((c) => (
                        <li key={c.id}>{c.note} <span style={{ color: "#8a6d1f" }}>({new Date(c.correctedAt).toLocaleDateString("en-GB")})</span></li>
                      ))}
                    </ul>
                  </aside>
                )}
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
                {displayBody.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>

              <aside className="article-aside">
                <section className="fact-card">
                  <span className="eyebrow">{tr("label.atAGlance")}</span>
                  <h2>{tr("label.keyFacts")}</h2>
                  <ul>{displayFacts.map((fact, index) => <li key={fact}><span>{index + 1}</span>{fact}</li>)}</ul>
                </section>
              </aside>
            </div>
            {article.matchRecap ? <MatchCentre recap={article.matchRecap} /> : null}
            {article.basketballRecap ? <BasketballCentre recap={article.basketballRecap} /> : null}
          </div>
        </article>

        <section className="page-width related-section">
          <div className="section-heading"><div><span className="eyebrow">{tr("label.continueReading")}</span><h2>{tr("label.fromTheDesk")}</h2></div></div>
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    </div>
  );
}
