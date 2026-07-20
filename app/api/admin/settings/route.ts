import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getSettings, updateSettings } from "@/lib/admin/settings";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const patch = await req.json().catch(() => ({}));
  const settings = await updateSettings(patch, session.sub);
  await recordAudit({ actor: session.sub, action: "settings.update", summary: "Updated settings" });
  return NextResponse.json({ settings });
}
