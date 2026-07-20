import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { addCorrection, deleteCorrection, listCorrections } from "@/lib/admin/corrections";
import { getArticleById } from "@/lib/admin/store";

export const runtime = "nodejs";

export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ corrections: await listCorrections() });
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.edit")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { articleId, note } = await req.json().catch(() => ({}));
  if (!articleId || !note?.trim()) return NextResponse.json({ error: "articleId and note are required" }, { status: 400 });
  const article = await getArticleById(articleId);
  if (!article) return NextResponse.json({ error: "article not found" }, { status: 404 });

  const correction = await addCorrection({
    articleId, articleSlug: article.slug, articleTitle: article.title, note: note.trim(), by: session.sub,
  });
  await recordAudit({ actor: session.sub, action: "correction.add", target: articleId, summary: `Correction on "${article.title}"` });
  return NextResponse.json({ correction, corrections: await listCorrections() }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.edit")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteCorrection(id, session.sub);
  await recordAudit({ actor: session.sub, action: "correction.delete", target: id, summary: "Removed correction" });
  return NextResponse.json({ corrections: await listCorrections() });
}
