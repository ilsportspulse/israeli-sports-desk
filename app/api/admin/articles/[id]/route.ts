import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkAnonymity } from "@/lib/admin/anonymity";
import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { deleteArticle, getArticleById, updateArticle } from "@/lib/admin/store";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.view")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const article = await getArticleById(params.id);
  if (!article) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.edit")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const patch = await req.json().catch(() => ({}));

  // Publishing through an edit must satisfy the same gates as the publish action:
  // the publish capability + the founder-anonymity guard.
  if (patch.status === "published") {
    if (!can(session.role, "articles.publish")) {
      return NextResponse.json({ error: "You cannot publish — save as review instead." }, { status: 403 });
    }
    const existing = await getArticleById(params.id);
    const merged = { ...existing, ...patch };
    const violations = await checkAnonymity(merged);
    if (violations.length) {
      return NextResponse.json(
        { error: `Blocked: founder-anonymity guard found "${violations.join('", "')}". Remove before publishing.` },
        { status: 422 },
      );
    }
  }

  const article = await updateArticle(params.id, patch, session.sub);
  if (!article) return NextResponse.json({ error: "not found" }, { status: 404 });
  await recordAudit({
    actor: session.sub,
    action: "article.update",
    target: article.id,
    summary: `Edited "${article.title}"`,
  });
  return NextResponse.json({ article });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.delete")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const removed = await deleteArticle(params.id);
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });
  await recordAudit({
    actor: session.sub,
    action: "article.delete",
    target: removed.id,
    summary: `Deleted "${removed.title}"`,
  });
  return NextResponse.json({ ok: true });
}
