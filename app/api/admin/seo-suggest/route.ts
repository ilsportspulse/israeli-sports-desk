import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

// AI-driven SEO suggestions for the article editor. Uses the same Anthropic
// account as the newsroom (ANTHROPIC_API_KEY); when no key is configured it
// falls back to a heuristic extraction so the button always works.

type Suggestion = { focusKeyword: string; keywords: string[]; metaTitle: string; metaDescription: string; source: "ai" | "heuristic" };

const STOPWORDS = new Set(
  "the a an and or but of in on at to for with from by over after before against as is are was were be been has have had will would his her its their this that these those it he she they we you not no says say said new first last".split(" "),
);

function heuristic(title: string, dek: string, body: string[], category: string): Suggestion {
  // Split on sentence punctuation first so entity phrases never bridge two
  // sentences ("…Season Even Starts. An MRI…" must not yield "Starts An MRI").
  const fragments = [title, dek, ...body].flatMap((t) => t.split(/[.!?;:—]+/));
  // Proper-noun phrases (consecutive capitalised words) are the best keyword
  // candidates in sports copy: clubs, players, competitions.
  const entities = new Map<string, number>();
  for (const fragment of fragments) {
    const matches = Array.from(fragment.matchAll(/\b([A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]+){0,3})\b/g));
    for (const m of matches) {
      const phrase = m[1].trim();
      const first = phrase.split(/\s+/)[0].toLowerCase();
      if (STOPWORDS.has(first) || phrase.length < 3) continue;
      entities.set(phrase, (entities.get(phrase) ?? 0) + 1);
    }
  }
  const ranked = Array.from(entities.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([p]) => p)
    .filter((p, i, arr) => !arr.slice(0, i).some((prev) => prev.includes(p)));
  const keywords = Array.from(new Set([...ranked.slice(0, 6), category, "Israeli sport"])).filter(Boolean).slice(0, 8);
  const focusKeyword = ranked[0] ?? category;
  const metaTitle = title.length <= 65 ? title : `${title.slice(0, 62).replace(/\s+\S*$/, "")}…`;
  const metaDescription = dek.length <= 160 ? dek : `${dek.slice(0, 157).replace(/\s+\S*$/, "")}…`;
  return { focusKeyword, keywords, metaTitle, metaDescription, source: "heuristic" };
}

async function viaAnthropic(title: string, dek: string, body: string[], category: string): Promise<Suggestion | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const prompt = `You are the SEO editor of Israel Sports Pulse (English-language Israeli sports news).
For the article below, produce STRICT JSON (no fences, no commentary) with exactly these keys:
{"focusKeyword": string, "keywords": string[], "metaTitle": string, "metaDescription": string}

Rules:
- focusKeyword: the single search phrase this article should rank for (2-5 words).
- keywords: 5-8 search phrases (clubs, players, competition, topic; include "Israeli sport" angle where natural).
- metaTitle: max 65 characters, compelling, includes the focus keyword.
- metaDescription: 120-160 characters, factual, no clickbait.
- Never invent facts not present in the article.

Category: ${category}
Title: ${title}
Dek: ${dek}
Body:
${body.join("\n").slice(0, 4000)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_SEO_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const text: string = data?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed.focusKeyword || !Array.isArray(parsed.keywords)) return null;
    return {
      focusKeyword: String(parsed.focusKeyword),
      keywords: parsed.keywords.map(String).slice(0, 8),
      metaTitle: String(parsed.metaTitle ?? "").slice(0, 70),
      metaDescription: String(parsed.metaDescription ?? "").slice(0, 170),
      source: "ai",
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session || !can(session.role, "articles.edit")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { title?: string; dek?: string; body?: string[]; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const title = (body.title ?? "").toString().trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  const dek = (body.dek ?? "").toString();
  const paragraphs = Array.isArray(body.body) ? body.body.map(String) : [];
  const category = (body.category ?? "").toString();

  const suggestion =
    (await viaAnthropic(title, dek, paragraphs, category).catch(() => null)) ??
    heuristic(title, dek, paragraphs, category);
  return NextResponse.json({ suggestion });
}
