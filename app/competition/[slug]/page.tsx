import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompetitionPage } from "@/components/competition-page";
import { siteConfig } from "@/config/site";
import { getPublicArticleSummaries } from "@/lib/articles";
import { competitionPriority } from "@/lib/competition-priority";
import { getCompetition, listCompetitions } from "@/lib/competitions";
import { getScoreCentreData } from "@/lib/sports-data";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } | Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [data, articles] = await Promise.all([getScoreCentreData(), Promise.resolve(getPublicArticleSummaries())]);
  const competition = getCompetition(data, articles, slug);
  if (!competition) return {};
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const title = `${competition.name} — scores, fixtures & standings`;
  const description = `Live scores, fixtures, results and standings for ${competition.name} on Israel Sports Pulse.`;
  return {
    title,
    description,
    alternates: { canonical: `${base}/competition/${slug}` },
    openGraph: { type: "website", title, description, url: `${base}/competition/${slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [data, articles] = await Promise.all([getScoreCentreData(), Promise.resolve(getPublicArticleSummaries())]);
  const competition = getCompetition(data, articles, slug);
  if (!competition) notFound();
  const competitions = listCompetitions(data).sort(
    (a, b) => competitionPriority(a.sport, a.name) - competitionPriority(b.sport, b.name),
  );
  return <CompetitionPage competition={competition} competitions={competitions} activeSlug={slug} />;
}
