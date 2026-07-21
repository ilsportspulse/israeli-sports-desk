import { Newsroom } from "@/components/newsroom";
import { getCategoryOrder } from "@/lib/admin/taxonomy";
import { getPublicArticleSummaries } from "@/lib/articles";
import { getLocalizedArticleSummaryCopy } from "@/lib/localized-articles";
import { getDailyQuiz } from "@/lib/quiz";
import { getRequestLocale } from "@/lib/request-locale";
import { getScoreCentreData } from "@/lib/sports-data";

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
  // client hydration light — the newest archive/analysis/international items all fall
  // well within this window, so no section loses content. This trims page weight
  // without changing what a visitor actually sees.
  const articles = [...allArticles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 100);

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
