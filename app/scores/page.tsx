import { notFound } from "next/navigation";

import { CompetitionPage } from "@/components/competition-page";
import { getPublicArticleSummaries } from "@/lib/articles";
import { competitionPriority } from "@/lib/competition-priority";
import { getCompetition, listCompetitions } from "@/lib/competitions";
import { getScoreCentreData } from "@/lib/sports-data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Scores — Israeli Premier League & every competition" };

// Scores lands directly on the Israeli Premier League hub (results, live &
// upcoming, standings and stats), with a switcher to every other competition.
export default async function ScoresPage() {
  const [data, articles] = await Promise.all([getScoreCentreData(), Promise.resolve(getPublicArticleSummaries())]);
  const competitions = listCompetitions(data).sort(
    (a, b) => competitionPriority(a.sport, a.name) - competitionPriority(b.sport, b.name),
  );
  const slug =
    competitions.find((c) => c.sport === "Football" && /premier league/i.test(c.name))?.slug ?? competitions[0]?.slug;
  const competition = slug ? getCompetition(data, articles, slug) : null;
  if (!competition) notFound();
  return <CompetitionPage competition={competition} competitions={competitions} activeSlug={slug} />;
}
