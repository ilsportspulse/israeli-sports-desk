import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompetitionPage } from "@/components/competition-page";
import { siteConfig } from "@/config/site";
import { getPublicArticleSummaries } from "@/lib/articles";
import { competitionPriority } from "@/lib/competition-priority";
import { getCompetition, listCompetitions } from "@/lib/competitions";
import { getRequestLocale } from "@/lib/request-locale";
import { getScoreCentreData } from "@/lib/sports-data";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } | Promise<{ slug: string }> };

const META_COPY: Record<string, (name: string) => { title: string; description: string }> = {
  en: (name) => ({
    title: `${name} — scores, fixtures & standings`,
    description: `Live scores, fixtures, results and standings for ${name} on Israel Sports Pulse.`,
  }),
  fr: (name) => ({
    title: `${name} — scores, calendrier et classement`,
    description: `Scores en direct, calendrier, résultats et classement de ${name} sur Israel Sports Pulse.`,
  }),
  es: (name) => ({
    title: `${name} — resultados, calendario y clasificación`,
    description: `Resultados en directo, calendario, resultados y clasificación de ${name} en Israel Sports Pulse.`,
  }),
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [data, articles] = await Promise.all([getScoreCentreData(), Promise.resolve(getPublicArticleSummaries())]);
  const competition = getCompetition(data, articles, slug);
  if (!competition) return {};
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const locale = getRequestLocale();
  const { title, description } = (META_COPY[locale] ?? META_COPY.en)(competition.name);
  return {
    title,
    description,
    alternates: { canonical: `${base}/competition/${slug}` },
    openGraph: { type: "website", title, description, url: `${base}/competition/${slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const locale = getRequestLocale();
  const [data, articles] = await Promise.all([getScoreCentreData(), Promise.resolve(getPublicArticleSummaries())]);
  const competition = getCompetition(data, articles, slug);
  if (!competition) notFound();
  const competitions = listCompetitions(data).sort(
    (a, b) => competitionPriority(a.sport, a.name) - competitionPriority(b.sport, b.name),
  );
  return <CompetitionPage competition={competition} competitions={competitions} activeSlug={slug} locale={locale} />;
}
