import { NextResponse } from "next/server";

import { getScoreCentreData } from "@/lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const scores = await getScoreCentreData();
  return NextResponse.json({
    status: scores.health === "degraded" ? "degraded" : "ok",
    now: new Date().toISOString(),
    newsRefreshMinutes: 30,
    scoreRefreshSeconds: 120,
    sportsProvider: scores.provider,
    sportsHealth: scores.health,
  });
}
