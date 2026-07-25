import articlesJson from "@/data/articles.json";
import { contentTimezone, defaultLocale, getLocaleDefinition, type LocaleCode } from "@/lib/locales";
import type { Article, PublicArticle, PublicArticleSummary } from "@/lib/types";

const articles = articlesJson as Article[];

export function getArticles() {
  return articles.filter((article) => article.status !== "review").sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function toPublicArticle(article: Article): PublicArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    category: article.category,
    kind: article.kind,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    readMinutes: article.readMinutes,
    body: article.body,
    facts: article.facts,
    theme: article.theme,
    image: article.image,
    desk: article.desk,
    archiveDate: article.archiveDate,
    archiveDisplay: article.archiveDisplay,
    video: article.video,
    officialSocialPost: article.officialSocialPost,
    matchRecap: article.matchRecap,
    basketballRecap: article.basketballRecap,
    featured: article.featured,
    homepagePriority: article.homepagePriority,
    trending: article.trending,
  };
}

export function toPublicArticleSummary(article: Article): PublicArticleSummary {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    category: article.category,
    kind: article.kind,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    readMinutes: article.readMinutes,
    theme: article.theme,
    image: article.image,
    desk: article.desk,
    archiveDate: article.archiveDate,
    archiveDisplay: article.archiveDisplay,
    matchRecap: article.matchRecap,
    basketballRecap: article.basketballRecap,
    featured: article.featured,
    homepagePriority: article.homepagePriority,
    trending: article.trending,
  };
}

export function getPublicArticles() {
  return getArticles().map(toPublicArticle);
}

export function getPublicArticleSummaries() {
  return getArticles().map(toPublicArticleSummary);
}

export function getArticle(slug: string) {
  return articles.find(
    (article) => article.slug === slug && article.status !== "review",
  );
}

// Backoffice preview: also finds articles still in review. Only ever call this
// behind an admin-session check — review copy must never reach the public.
export function getArticleIncludingReview(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getReviewArticles() {
  return articles.filter((article) => article.status === "review");
}

export function getCategories() {
  return Array.from(new Set(articles.map((article) => article.category)));
}

export function formatArticleDate(value: string, compact = false, locale: LocaleCode = defaultLocale) {
  return new Intl.DateTimeFormat(getLocaleDefinition(locale).bcp47, {
    timeZone: contentTimezone,
    day: "numeric",
    month: compact ? "short" : "long",
    year: compact ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: compact ? undefined : "short",
  }).format(new Date(value));
}
