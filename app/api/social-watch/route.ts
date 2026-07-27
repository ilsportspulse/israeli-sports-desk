import { NextResponse } from "next/server";

import { getSocialWatchItems } from "@/lib/social-watch";

export const dynamic = "force-dynamic";

// Client refresh endpoint for the Israeli News Watcher: the homepage renders
// server-side for SEO, then polls this route so the wall keeps ticking live.
export function GET() {
  return NextResponse.json(
    { updatedAt: new Date().toISOString(), items: getSocialWatchItems(24) },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } },
  );
}
