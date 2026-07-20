import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { addRedirect, listRedirects, removeRedirect } from "@/lib/admin/store";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ redirects: await listRedirects() });
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { from, to, code } = await req.json().catch(() => ({}));
  if (!from || !to) return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  // Prevent open redirects: destinations must be same-site relative paths.
  if (!to.startsWith("/") || to.startsWith("//")) {
    return NextResponse.json({ error: "Destination must be a relative path starting with / (no external URLs)." }, { status: 400 });
  }
  await addRedirect(from, to, code === 302 ? 302 : 301, `manual by ${session.sub}`);
  await recordAudit({ actor: session.sub, action: "redirect.create", summary: `${from} → ${to}` });
  return NextResponse.json({ redirects: await listRedirects() }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const from = req.nextUrl.searchParams.get("from");
  if (!from) return NextResponse.json({ error: "from is required" }, { status: 400 });
  await removeRedirect(from);
  await recordAudit({ actor: session.sub, action: "redirect.delete", summary: `Removed ${from}` });
  return NextResponse.json({ redirects: await listRedirects() });
}
