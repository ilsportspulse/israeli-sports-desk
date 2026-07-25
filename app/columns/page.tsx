import type { Metadata } from "next";

import { StoryIndex } from "@/components/story-index";
import { getPublicArticleSummaries } from "@/lib/articles";
import { getLocalizedArticleSummaryCopy } from "@/lib/localized-articles";
import { getRequestLocale } from "@/lib/request-locale";

const COPY: Record<string, { title: string; description: string; eyebrow: string; heading: string; intro: string }> = {
  en: {
    title: "ILSP Columns",
    description: "The complete collection of Israel Sports Pulse analysis and opinion columns.",
    eyebrow: "ILSP Columns",
    heading: "Every argument, in one place.",
    intro: "Tactical, strategic, financial and cultural analysis stays accessible after the daily homepage selection changes.",
  },
  fr: {
    title: "Chroniques ILSP",
    description: "La collection complète des analyses et chroniques d’opinion d’Israel Sports Pulse.",
    eyebrow: "Chroniques ILSP",
    heading: "Chaque débat, au même endroit.",
    intro: "Les analyses tactiques, stratégiques, financières et culturelles restent accessibles une fois que la sélection quotidienne de la page d’accueil a changé.",
  },
  es: {
    title: "Columnas ILSP",
    description: "La colección completa de análisis y columnas de opinión de Israel Sports Pulse.",
    eyebrow: "Columnas ILSP",
    heading: "Cada debate, en un solo lugar.",
    intro: "El análisis táctico, estratégico, financiero y cultural sigue accesible una vez que cambia la selección diaria de la portada.",
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { title: copy.title, description: copy.description };
}

export default function ColumnsPage() {
  const locale = getRequestLocale();
  const copy = COPY[locale] ?? COPY.en;
  const articles = getPublicArticleSummaries()
    .filter((article) => article.kind === "analysis")
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
