import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

// Purge the CDN/data cache for key public routes (or a specific path) so edits
// show up immediately without waiting for a redeploy.
export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { path } = await req.json().catch(() => ({ path: undefined }));
  const targets = path ? [path] : ["/", "/stories", "/scores", "/columns", "/archive"];
  for (const t of targets) {
    try { revalidatePath(t); } catch { /* ignore individual failures */ }
  }
  await recordAudit({ actor: session.sub, action: "cache.revalidate", summary: `Revalidated ${targets.join(", ")}` });
  return NextResponse.json({ ok: true, revalidated: targets });
}
