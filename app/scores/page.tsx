import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompetitionPage } from "@/components/competition-page";
import { getPublicArticleSummaries } from "@/lib/articles";
import { competitionPriority } from "@/lib/competition-priority";
import { getCompetition, listCompetitions } from "@/lib/competitions";
import { getRequestLocale } from "@/lib/request-locale";
import { getScoreCentreData } from "@/lib/sports-data";

export const dynamic = "force-dynamic";

const SCORES_TITLE: Record<string, string> = {
  en: "Scores — Israeli Premier League & every competition",
  fr: "Scores — Championnat israélien et toutes les compétitions",
  es: "Resultados — Liga israelí y todas las competiciones",
};

export function generateMetadata(): Metadata {
  return { title: SCORES_TITLE[getRequestLocale()] ?? SCORES_TITLE.en };
}

// Scores lands directly on the Israeli Premier League hub (results, live &
// upcoming, standings and stats), with a switcher to every other competition.
export default async function ScoresPage() {
  const locale = getRequestLocale();
  const [data, articles] = await Promise.all([getScoreCentreData(), Promise.resolve(getPublicArticleSummaries())]);
  const competitions = listCompetitions(data).sort(
    (a, b) => competitionPriority(a.sport, a.name) - competitionPriority(b.sport, b.name),
  );
  const slug =
    competitions.find((c) => c.sport === "Football" && /premier league/i.test(c.name))?.slug ?? competitions[0]?.slug;
  const competition = slug ? getCompetition(data, articles, slug) : null;
  if (!competition) notFound();
  return <CompetitionPage competition={competition} competitions={competitions} activeSlug={slug} locale={locale} />;
}
