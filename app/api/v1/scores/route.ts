import { NextResponse } from "next/server";

import scoreFixture from "@/packages/api-contracts/fixtures/score-event.football.json";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      data: [scoreFixture],
      page: { nextCursor: null },
      meta: { locale: "en", timezone: "Asia/Jerusalem" },
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120" } },
  );
}
