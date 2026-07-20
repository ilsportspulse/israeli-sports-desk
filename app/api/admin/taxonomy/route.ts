import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getTaxonomy, updateTaxonomy } from "@/lib/admin/taxonomy";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ taxonomy: await getTaxonomy() });
}

export async function PUT(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const patch = await req.json().catch(() => ({}));
  const taxonomy = await updateTaxonomy(patch, session.sub);
  await recordAudit({ actor: session.sub, action: "taxonomy.update", summary: "Updated taxonomy / navigation" });
  return NextResponse.json({ taxonomy });
}
