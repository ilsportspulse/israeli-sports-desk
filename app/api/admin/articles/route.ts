import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { createArticle, listArticles, type ArticleFilter } from "@/lib/admin/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.view")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const p = req.nextUrl.searchParams;
  const filter: ArticleFilter = {
    status: (p.get("status") as ArticleFilter["status"]) ?? "all",
    desk: p.get("desk") || undefined,
    category: p.get("category") || undefined,
    search: p.get("search") || undefined,
  };
  const articles = await listArticles(filter);
  return NextResponse.json({ articles });
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "articles.edit")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const input = await req.json().catch(() => ({}));
  // New articles always start in review; publishing goes through the guarded
  // publish action (capability + founder-anonymity check). This prevents a
  // contributor from creating already-published content.
  const article = await createArticle({ ...input, status: "review" });
  await recordAudit({
    actor: session.sub,
    action: "article.create",
    target: article.id,
    summary: `Created "${article.title}"`,
  });
  return NextResponse.json({ article }, { status: 201 });
}
