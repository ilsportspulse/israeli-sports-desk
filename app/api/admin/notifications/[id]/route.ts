import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { deleteNotification, listNotifications, sendNotification } from "@/lib/admin/notifications";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.publish")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const n = await sendNotification(params.id);
  if (!n) return NextResponse.json({ error: "not found" }, { status: 404 });
  await recordAudit({ actor: session.sub, action: "notif.send", target: params.id, summary: `Sent notification "${n.title}"` });
  return NextResponse.json({ notification: n, queue: await listNotifications() });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.publish")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await deleteNotification(params.id);
  return NextResponse.json({ queue: await listNotifications() });
}
