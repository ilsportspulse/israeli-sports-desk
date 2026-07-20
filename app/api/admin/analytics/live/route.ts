import { NextResponse } from "next/server";

import { getApiAdmin } from "@/lib/admin/auth";
import { getAnalyticsSummary } from "@/lib/analytics/aggregate";

export const runtime = "nodejs";

// Lightweight endpoint the dashboard polls for the realtime "who's on now" panel.
export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const s = await getAnalyticsSummary(1);
  return NextResponse.json({ liveNow: s.liveNow, livePaths: s.livePaths, viewsToday: s.viewsToday, visitorsToday: s.visitorsToday });
}
