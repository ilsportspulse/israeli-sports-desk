import type { Metadata } from "next";

import { StoryIndex } from "@/components/story-index";
import { getPublicArticleSummaries } from "@/lib/articles";
import { getLocalizedArticleSummaryCopy } from "@/lib/localized-articles";
import { getRequestLocale } from "@/lib/request-locale";

const COPY: Record<string, { title: string; description: string; eyebrow: string; heading: string; intro: string }> = {
  en: {
    title: "All stories",
    description: "Every published Israel Sports Pulse report, feature and column in one permanent chronological index.",
    eyebrow: "The complete desk",
    heading: "Every ILSP story, always available.",
    intro: "Browse every published report, feature and column from Israel Sports Pulse. New homepage priorities never remove earlier journalism from this index.",
  },
  fr: {
    title: "Tous les articles",
    description: "Chaque reportage, dossier et chronique publié par Israel Sports Pulse, réuni dans un index chronologique permanent.",
    eyebrow: "La rédaction complète",
    heading: "Chaque article d’ILSP, toujours disponible.",
    intro: "Parcourez tous les reportages, dossiers et chroniques publiés par Israel Sports Pulse. Les nouvelles priorités de la page d’accueil ne retirent jamais un article plus ancien de cet index.",
  },
  es: {
    title: "Todas las noticias",
    description: "Cada reportaje, artículo y columna publicado por Israel Sports Pulse, reunido en un índice cronológico permanente.",
    eyebrow: "La redacción completa",
    heading: "Cada noticia de ILSP, siempre disponible.",
    intro: "Explora todos los reportajes, artículos y columnas publicados por Israel Sports Pulse. Las nuevas prioridades de la portada nunca eliminan el periodismo anterior de este índice.",
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { title: copy.title, description: copy.description };
}

export default function StoriesPage() {
  const locale = getRequestLocale();
  const copy = COPY[locale] ?? COPY.en;
  const articles = getPublicArticleSummaries().map((article) => {
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
