import translationsJson from "@/data/content-translations.json";

import type { PublicArticle, PublicArticleSummary } from "@/lib/types";
import type { LocaleCode } from "@/lib/locales";

type SummaryTranslation = {
  articleId: string;
  locale: "he";
  sourceUpdatedAt: string;
  status: "reviewed-prototype";
  coverage: "summary" | "full";
  title: string;
  dek: string;
  category: string;
  body?: string[];
  facts?: string[];
  media?: {
    alt: string;
    caption: string;
  };
};

export type LocalizedArticleSummaryCopy = Pick<PublicArticleSummary, "title" | "dek" | "category"> & {
  locale: LocaleCode;
};

export type LocalizedArticleDetailCopy = LocalizedArticleSummaryCopy & {
  body: string[];
  facts: string[];
  media: {
    alt: string;
    caption: string;
  };
};

const summaryTranslations = translationsJson.translations as SummaryTranslation[];

export function getLocalizedArticleSummaryCopy(
  article: PublicArticleSummary,
  locale: LocaleCode,
): LocalizedArticleSummaryCopy | null {
  if (locale === "en") {
    return {
      locale,
      title: article.title,
      dek: article.dek,
      category: article.category,
    };
  }

  const sourceVersion = article.updatedAt ?? article.publishedAt;
  const translation = summaryTranslations.find(
    (item) => item.articleId === article.id
      && item.locale === locale
      && item.status === "reviewed-prototype"
      && (item.coverage === "summary" || item.coverage === "full")
      && item.sourceUpdatedAt === sourceVersion,
  );

  if (!translation) return null;
  return {
    locale,
    title: translation.title,
    dek: translation.dek,
    category: translation.category,
  };
}

export function getLocalizedArticleDetailCopy(
  article: PublicArticle,
  locale: LocaleCode,
): LocalizedArticleDetailCopy | null {
  if (locale === "en") {
    return {
      locale,
      title: article.title,
      dek: article.dek,
      category: article.category,
      body: article.body,
      facts: article.facts,
      media: {
        alt: article.image?.alt ?? article.title,
        caption: article.image?.caption ?? article.dek,
      },
    };
  }

  const sourceVersion = article.updatedAt ?? article.publishedAt;
  const translation = summaryTranslations.find(
    (item) => item.articleId === article.id
      && item.locale === locale
      && item.status === "reviewed-prototype"
      && item.coverage === "full"
      && item.sourceUpdatedAt === sourceVersion,
  );

  if (
    !translation
    || !translation.body
    || translation.body.length < 5
    || !translation.facts
    || translation.facts.length < 4
    || !translation.media?.alt.trim()
    || !translation.media.caption.trim()
  ) return null;

  return {
    locale,
    title: translation.title,
    dek: translation.dek,
    category: translation.category,
    body: translation.body,
    facts: translation.facts,
    media: translation.media,
  };
}
