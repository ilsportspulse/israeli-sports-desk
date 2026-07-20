import { Newsroom } from "@/components/newsroom";
import { getPublicArticleSummaries } from "@/lib/articles";
import { getDailyQuiz } from "@/lib/quiz";
import { getScoreCentreData } from "@/lib/sports-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [articles, scores] = await Promise.all([
    Promise.resolve(getPublicArticleSummaries()),
    getScoreCentreData(),
  ]);
  return <Newsroom articles={articles} scores={scores} quiz={getDailyQuiz()} />;
}
