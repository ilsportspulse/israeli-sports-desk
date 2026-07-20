import { NextResponse } from "next/server";

import { getScoreCentreData } from "@/lib/sports-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getScoreCentreData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
