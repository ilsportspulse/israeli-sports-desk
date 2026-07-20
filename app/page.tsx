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
  const [articles, scores, categoryOrder] = await Promise.all([
    Promise.resolve(getPublicArticleSummaries()),
    getScoreCentreData(),
    getCategoryOrder(),
  ]);

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
