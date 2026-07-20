import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { createNotification, getNotifConfig, listNotifications, updateNotifConfig } from "@/lib/admin/notifications";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [config, queue] = await Promise.all([getNotifConfig(), listNotifications()]);
  return NextResponse.json({ config, queue, fcmReady: Boolean(process.env.FCM_SERVER_KEY) });
}

export async function PUT(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const config = await updateNotifConfig(await req.json().catch(() => ({})), session.sub);
  await recordAudit({ actor: session.sub, action: "notif.config", summary: "Updated app/notification config" });
  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.publish")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { title, body, deepLink, segment, platform, scheduledAt, status } = await req.json().catch(() => ({}));
  if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  const n = await createNotification({
    title: title.trim(), body: body.trim(), deepLink: deepLink || undefined,
    segment: segment || "all", platform: platform || "all", scheduledAt: scheduledAt || undefined,
    createdBy: session.sub, status,
  });
  await recordAudit({ actor: session.sub, action: "notif.compose", target: n.id, summary: `Composed notification "${n.title}"` });
  return NextResponse.json({ notification: n, queue: await listNotifications() }, { status: 201 });
}
