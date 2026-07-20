import { NextResponse } from "next/server";

import { getPublicArticleSummaries } from "@/lib/articles";
import { getLocalizedArticleSummaryCopy } from "@/lib/localized-articles";
import { isLocaleCode, type LocaleCode } from "@/lib/locales";
import { getArticleImage } from "@/lib/media";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const requestedLocale = new URL(request.url).searchParams.get("locale") ?? "en";
  if (!isLocaleCode(requestedLocale)) {
    return NextResponse.json(
      {
        schemaVersion: "1.0",
        generatedAt: new Date().toISOString(),
        data: null,
        meta: { locale: "en", timezone: "Asia/Jerusalem" },
      },
      { status: 400 },
    );
  }
  const locale: LocaleCode = requestedLocale;
  const articles = getPublicArticleSummaries().flatMap((article) => {
    const copy = getLocalizedArticleSummaryCopy(article, locale);
    if (!copy) return [];
    const image = getArticleImage(article);
    return [{
      schemaVersion: "1.0",
      id: article.id,
      slug: article.slug,
      locale: copy.locale,
      status: "published",
      title: copy.title,
      dek: copy.dek,
      category: copy.category,
      kind: article.kind,
      publishedAt: article.publishedAt,
      readMinutes: article.readMinutes,
      media: {
        src: image.src,
        alt: image.alt,
        caption: image.caption,
        credit: image.credit,
        creditUrl: image.creditUrl,
        license: image.license,
        licenseUrl: image.licenseUrl,
      },
    }];
  });

  return NextResponse.json(
    {
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      data: articles,
      page: { nextCursor: null },
      meta: { locale, timezone: "Asia/Jerusalem" },
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
  );
}
