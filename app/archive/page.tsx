import type { Metadata } from "next";

import { StoryIndex } from "@/components/story-index";
import { getPublicArticleSummaries } from "@/lib/articles";
import { getLocalizedArticleSummaryCopy } from "@/lib/localized-articles";
import { getRequestLocale } from "@/lib/request-locale";
import { pageAlternates } from "@/lib/seo-alternates";

const COPY: Record<string, { title: string; description: string; eyebrow: string; heading: string; intro: string }> = {
  en: {
    title: "From the Archive",
    description: "Every Israel Sports Pulse daily historical feature, preserved in one permanent collection.",
    eyebrow: "One beautiful story every day",
    heading: "Israeli sporting history, collected.",
    intro: "The newest feature leads the homepage, while every previous edition remains here as part of a growing daily history of Israeli sport.",
  },
  fr: {
    title: "Depuis les archives",
    description: "Chaque dossier historique quotidien d’Israel Sports Pulse, conservé dans une collection permanente.",
    eyebrow: "Une belle histoire chaque jour",
    heading: "L’histoire du sport israélien, rassemblée.",
    intro: "Le dossier le plus récent ouvre la page d’accueil, tandis que chaque édition précédente reste ici, au sein d’une histoire quotidienne du sport israélien qui ne cesse de grandir.",
  },
  es: {
    title: "Desde el archivo",
    description: "Cada reportaje histórico diario de Israel Sports Pulse, conservado en una colección permanente.",
    eyebrow: "Una gran historia cada día",
    heading: "La historia del deporte israelí, reunida.",
    intro: "El reportaje más reciente encabeza la portada, mientras que cada edición anterior permanece aquí, como parte de una historia diaria del deporte israelí en constante crecimiento.",
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { alternates: pageAlternates("/archive"), title: copy.title, description: copy.description };
}

export default function ArchivePage() {
  const locale = getRequestLocale();
  const copy = COPY[locale] ?? COPY.en;
  const articles = getPublicArticleSummaries()
    .filter((article) => article.category === "From the Archive")
    .map((article) => {
      const localized = getLocalizedArticleSummaryCopy(article, locale);
      return localized ? { ...article, title: localized.title, dek: localized.dek, category: localized.category } : article;
    });
  return (
    <StoryIndex
      eyebrow={copy.eyebrow}
      title={copy.heading}
      introduction={copy.intro}
      articles={articles}
      locale={locale}
    />
  );
}
