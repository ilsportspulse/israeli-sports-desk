import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { deletePost, getPost, getSocialConfig, listPosts, updatePost } from "@/lib/admin/social";
import { dispatchPost } from "@/lib/admin/social-adapters";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// POST { action: "post-now" } — dispatch to the platforms and record results.
export async function POST(req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.publish")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { action } = await req.json().catch(() => ({ action: "post-now" }));
  if (action !== "post-now") return NextResponse.json({ error: "unknown action" }, { status: 400 });

  const post = await getPost(params.id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  const config = await getSocialConfig();
  const results = await dispatchPost(post, config);
  const anyOk = Object.values(results).some((r) => r.ok);
  const updated = await updatePost(params.id, {
    status: anyOk ? "posted" : "failed",
    postedAt: new Date().toISOString(),
    results,
  });
  await recordAudit({ actor: session.sub, action: "social.post", target: post.id, summary: anyOk ? "Posted to social" : "Social post failed" });
  return NextResponse.json({ post: updated, posts: await listPosts() });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.publish")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await deletePost(params.id);
  await recordAudit({ actor: session.sub, action: "social.delete", target: params.id, summary: "Deleted social post" });
  return NextResponse.json({ posts: await listPosts() });
}
