import translationsJson from "@/data/content-translations.json";

import type { PublicArticle, PublicArticleSummary } from "@/lib/types";
import { defaultLocale, type LocaleCode } from "@/lib/locales";

// A translation targets a non-default locale (fr/es). English is always the
// canonical source and needs no stored translation.
export type TranslatedLocale = Exclude<LocaleCode, typeof defaultLocale>;

// Statuses we accept as publishable on the live site. Newsroom-generated
// translations land as "published"; human-reviewed copy as "reviewed".
const PUBLISHABLE_STATUSES = new Set(["published", "reviewed", "reviewed-prototype"]);

type StoredTranslation = {
  articleId: string;
  locale: LocaleCode;
  sourceUpdatedAt: string;
  status: string;
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

const storedTranslations = (translationsJson.translations ?? []) as StoredTranslation[];

function findTranslation(
  articleId: string,
  locale: LocaleCode,
  sourceVersion: string | undefined,
  requireFull: boolean,
): StoredTranslation | null {
  return (
    storedTranslations.find(
      (item) =>
        item.articleId === articleId &&
        item.locale === locale &&
        PUBLISHABLE_STATUSES.has(item.status) &&
        (requireFull ? item.coverage === "full" : item.coverage === "summary" || item.coverage === "full") &&
        // A source update invalidates a stale translation (unless the translation
        // was written without a pinned source version).
        (!item.sourceUpdatedAt || item.sourceUpdatedAt === sourceVersion),
    ) ?? null
  );
}

export function getLocalizedArticleSummaryCopy(
  article: PublicArticleSummary,
  locale: LocaleCode,
): LocalizedArticleSummaryCopy | null {
  if (locale === defaultLocale) {
    return {
      locale,
      title: article.title,
      dek: article.dek,
      category: article.category,
    };
  }

  const sourceVersion = article.updatedAt ?? article.publishedAt;
  const translation = findTranslation(article.id, locale, sourceVersion, false);
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
  if (locale === defaultLocale) {
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
  const translation = findTranslation(article.id, locale, sourceVersion, true);

  if (
    !translation ||
    !translation.body ||
    translation.body.length < 5 ||
    !translation.facts ||
    translation.facts.length < 4 ||
    !translation.media?.alt.trim() ||
    !translation.media.caption.trim()
  )
    return null;

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
