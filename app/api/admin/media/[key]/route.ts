import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { deleteMedia, getMedia, updateMedia, validateCaption } from "@/lib/admin/media-store";

export const runtime = "nodejs";

type Params = { params: { key: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const entry = await getMedia(decodeURIComponent(params.key));
  return NextResponse.json({ media: entry }); // null when the key has no image yet
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "media.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const key = decodeURIComponent(params.key);
  const patch = await req.json().catch(() => ({}));
  if (patch.caption) {
    const issue = validateCaption(patch.caption);
    if (issue) return NextResponse.json({ error: issue }, { status: 422 });
  }
  const entry = await updateMedia(key, patch, session.sub);
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });
  await recordAudit({ actor: session.sub, action: "media.update", target: key, summary: `Updated media ${key}` });
  return NextResponse.json({ media: entry });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "media.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const key = decodeURIComponent(params.key);
  const ok = await deleteMedia(key, session.sub);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  await recordAudit({ actor: session.sub, action: "media.delete", target: key, summary: `Deleted media ${key}` });
  return NextResponse.json({ ok: true });
}
