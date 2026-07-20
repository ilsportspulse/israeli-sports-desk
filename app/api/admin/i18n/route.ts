import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getLocaleConfig, updateLocaleConfig } from "@/lib/admin/i18n";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ config: await getLocaleConfig() });
}

export async function PUT(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const config = await updateLocaleConfig(await req.json().catch(() => ({})));
  await recordAudit({ actor: session.sub, action: "i18n.update", summary: "Updated locales" });
  return NextResponse.json({ config });
}
