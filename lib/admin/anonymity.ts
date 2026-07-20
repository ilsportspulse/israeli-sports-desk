import { getSettings } from "@/lib/admin/settings";
import type { Article } from "@/lib/types";

// Founder-anonymity guard: the founder must never be identifiable on public
// surfaces. Before an article can go public, its reader-visible text is scanned
// for the configured banned terms (names/handles); a match blocks publication.

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function articlePublicText(a: Partial<Article>): string {
  return [
    a.title, a.dek, a.homepageReason,
    ...(a.body ?? []), ...(a.facts ?? []),
    a.seo?.metaTitle, a.seo?.metaDescription,
  ].filter(Boolean).join("  \n");
}

export function findBannedTerms(text: string, terms: string[]): string[] {
  const hay = text.toLowerCase();
  return terms
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => new RegExp(`(^|[^a-z0-9])${escapeRegex(t.toLowerCase())}([^a-z0-9]|$)`, "i").test(hay));
}

// Returns a list of violations if publishing this article would leak founder
// identity (empty array = safe). Only enforced when the guard is enabled.
export async function checkAnonymity(article: Partial<Article>): Promise<string[]> {
  const { compliance } = await getSettings();
  if (!compliance.founderAnonymity || compliance.bannedTerms.length === 0) return [];
  return findBannedTerms(articlePublicText(article), compliance.bannedTerms);
}
