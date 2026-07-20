import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { createPost, getSocialConfig, listPosts, updateSocialConfig, type Platform } from "@/lib/admin/social";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [config, posts] = await Promise.all([getSocialConfig(), listPosts()]);
  return NextResponse.json({ config, posts, telegramReady: Boolean(process.env.TELEGRAM_BOT_TOKEN) });
}

export async function PUT(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const patch = await req.json().catch(() => ({}));
  const config = await updateSocialConfig(patch, session.sub);
  await recordAudit({ actor: session.sub, action: "social.config", summary: "Updated social settings" });
  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.publish")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { text, link, hashtags, platforms, scheduledAt, status } = await req.json().catch(() => ({}));
  if (!text?.trim()) return NextResponse.json({ error: "Post text is required." }, { status: 400 });
  if (!Array.isArray(platforms) || platforms.length === 0) return NextResponse.json({ error: "Pick at least one platform." }, { status: 400 });

  const post = await createPost({
    text: text.trim(), link: link || undefined, hashtags: hashtags?.trim() || undefined, platforms: platforms as Platform[],
    scheduledAt: scheduledAt || undefined, createdBy: session.sub, status,
  });
  await recordAudit({ actor: session.sub, action: "social.compose", target: post.id, summary: `Queued a social post to ${post.platforms.join(", ")}` });
  return NextResponse.json({ post, posts: await listPosts() }, { status: 201 });
}
