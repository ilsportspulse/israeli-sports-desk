import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkAnonymity } from "@/lib/admin/anonymity";
import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { pingIndexNow } from "@/lib/admin/indexnow";
import { createPost, getSocialConfig } from "@/lib/admin/social";
import { duplicateArticle, getArticleById, setStatus } from "@/lib/admin/store";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// POST { action: "publish" | "reject" | "duplicate" }
export async function POST(req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action } = await req.json().catch(() => ({ action: "" }));

  if (action === "publish" || action === "reject") {
    if (!can(session.role, "articles.publish")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const target = action === "publish" ? "published" : "review";

    // Founder-anonymity guard: never let identifying content go public.
    if (action === "publish") {
      const existing = await getArticleById(params.id);
      if (existing) {
        const violations = await checkAnonymity(existing);
        if (violations.length) {
          return NextResponse.json(
            { error: `Blocked: founder-anonymity guard found "${violations.join('", "')}". Remove before publishing.` },
            { status: 422 },
          );
        }
      }
    }

    const article = await setStatus(params.id, target);
    if (!article) return NextResponse.json({ error: "not found" }, { status: 404 });
    await recordAudit({
      actor: session.sub,
      action: `article.${action}`,
      target: article.id,
      summary: `${action === "publish" ? "Published" : "Sent to review"} "${article.title}"`,
    });
    // Nudge search engines to (re)crawl a freshly published story.
    if (action === "publish") {
      await pingIndexNow([`/article/${article.slug}`]);
      // Optionally queue a social post for the new story.
      try {
        const social = await getSocialConfig();
        const targets = (Object.keys(social.enabled) as (keyof typeof social.enabled)[]).filter((p) => social.enabled[p]);
        if (social.autoPostOnPublish && targets.length) {
          await createPost({
            text: `${article.title}\n\n${article.dek ?? ""}`.trim(),
            link: `/article/${article.slug}`,
            platforms: targets,
            createdBy: session.sub,
            // Auto-posts land in the queue as drafts; the desk approves + sends
            // (or a scheduled worker dispatches when approval is off).
            status: "draft",
          });
        }
      } catch { /* never block publishing on social */ }
    }
    return NextResponse.json({ article });
  }

  if (action === "duplicate") {
    if (!can(session.role, "articles.edit")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const source = await getArticleById(params.id);
    const copy = await duplicateArticle(params.id);
    if (!copy) return NextResponse.json({ error: "not found" }, { status: 404 });
    await recordAudit({
      actor: session.sub,
      action: "article.duplicate",
      target: copy.id,
      summary: `Duplicated "${source?.title ?? params.id}"`,
    });
    return NextResponse.json({ article: copy });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
