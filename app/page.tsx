import { Newsroom } from "@/components/newsroom";
import { getCategoryOrder } from "@/lib/admin/taxonomy";
import { getPublicArticleSummaries } from "@/lib/articles";
import { getLocalizedArticleSummaryCopy } from "@/lib/localized-articles";
import { getDailyQuiz } from "@/lib/quiz";
import { getRequestLocale } from "@/lib/request-locale";
import { getScoreCentreData } from "@/lib/sports-data";
import type { PublicArticleSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const locale = getRequestLocale();
  const [allArticles, scores, categoryOrder] = await Promise.all([
    Promise.resolve(getPublicArticleSummaries()),
    getScoreCentreData(),
    getCategoryOrder(),
  ]);

  // The homepage only surfaces recent stories across its sections (the full archive
  // lives on /stories). Cap to the 100 most-recent to keep the rendered page and its
  // client hydration light. The Retro and Columns sections publish only one item per
  // day, so at the current news volume (~15-20 stories/day) a plain newest-100 window
  // starves them below their card counts — guarantee the newest of each on top of the
  // cap. They are appended date-sorted and are always older than their in-window
  // peers, so the sections' internal ordering is preserved.
  const byNewest = (a: PublicArticleSummary, b: PublicArticleSummary) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  const recent = [...allArticles].sort(byNewest).slice(0, 100);
  const guaranteed = [
    ...allArticles.filter((a) => a.category === "From the Archive").sort(byNewest).slice(0, 5),
    ...allArticles.filter((a) => a.kind === "analysis").sort(byNewest).slice(0, 3),
  ];
  const seen = new Set(recent.map((a) => a.id));
  const articles = [...recent, ...guaranteed.filter((a) => !seen.has(a.id))];

  // Localise summary copy where a translation exists; fall back to English.
  const localized = articles.map((article) => {
    const copy = getLocalizedArticleSummaryCopy(article, locale);
    return copy ? { ...article, title: copy.title, dek: copy.dek, category: copy.category } : article;
  });

  return (
    <Newsroom
      articles={localized}
      scores={scores}
      quiz={getDailyQuiz()}
      categoryOrder={categoryOrder}
      locale={locale}
    />
  );
}
