import { NextResponse } from "next/server";

import localeConfig from "@/data/locale-config.json";

export const dynamic = "force-dynamic";

export function GET() {
  const active = localeConfig.locales.filter((locale) => locale.status === "active").map((locale) => locale.code);
  const prototypes = localeConfig.locales.filter((locale) => locale.status === "prototype").map((locale) => locale.code);

  return NextResponse.json(
    {
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      data: {
        brand: "Israel Sports Pulse",
        defaultLocale: localeConfig.defaultLocale,
        availableLocales: active,
        publicLaunchLocales: active,
        prototypeLocales: prototypes,
        localePolicy: {
          publicLaunch: "english-only",
          prototypeLocalesPubliclySelectable: false,
        },
        features: {
          articles: true,
          scores: true,
          search: false,
          notifications: false,
        },
      },
      meta: { locale: "en", timezone: localeConfig.contentTimezone },
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" } },
  );
}
