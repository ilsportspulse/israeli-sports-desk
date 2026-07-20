import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getApiAdmin } from "@/lib/admin/auth";
import { auditMedia, listMedia } from "@/lib/admin/media-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const search = req.nextUrl.searchParams.get("search") || undefined;
  const [media, audit] = await Promise.all([listMedia(search), auditMedia()]);
  return NextResponse.json({ media, issues: audit.issues });
}
