import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getAffiliation, updateAffiliation } from "@/lib/admin/affiliation";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ affiliation: await getAffiliation() });
}

export async function PUT(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const patch = await req.json().catch(() => ({}));
  const affiliation = await updateAffiliation(patch, session.sub);
  await recordAudit({ actor: session.sub, action: "affiliation.update", summary: "Updated affiliation/monetisation" });
  return NextResponse.json({ affiliation });
}
