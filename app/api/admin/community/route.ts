import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getCommunity, updateCommunity } from "@/lib/admin/community";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ community: await getCommunity() });
}

export async function PUT(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "moderation.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const community = await updateCommunity(await req.json().catch(() => ({})), session.sub);
  await recordAudit({ actor: session.sub, action: "community.config", summary: "Updated community/moderation" });
  return NextResponse.json({ community });
}
