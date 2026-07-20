import { NextResponse } from "next/server";

import { getPublicArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { updatedAt: new Date().toISOString(), articles: getPublicArticles() },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
  );
}
