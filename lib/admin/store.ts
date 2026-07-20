import type { Article } from "@/lib/types";
import { readData, writeData } from "@/lib/admin/persist";

// Article store for the backoffice. Reads/writes data/articles.json straight
// from disk (NOT the bundled static import) so the admin always sees live file
// state. Persistence follows the git-commit model: a write updates the file →
// committing + pushing triggers a Vercel redeploy that serves it publicly. In
// local dev the change is live on the next request.
//
// (A production write-through that commits via the GitHub Contents API is the
// next task; this disk layer is the single source of truth it will wrap.)

const ARTICLES_REL = "data/articles.json";
const REDIRECTS_REL = "data/redirects.json";

export type Redirect = { from: string; to: string; code: 301 | 302; createdAt: string; reason?: string };

export type ArticleFilter = {
  status?: "published" | "review" | "all";
  desk?: string;
  category?: string;
  search?: string;
};

async function readArticles(): Promise<Article[]> {
  const parsed = await readData<Article[] | { articles: Article[] }>(ARTICLES_REL, []);
  const list = Array.isArray(parsed) ? parsed : parsed.articles;
  return (list ?? []) as Article[];
}

async function writeArticles(articles: Article[], opts?: { actor?: string; message?: string }): Promise<void> {
  await writeData(ARTICLES_REL, articles, opts);
}

async function readRedirects(): Promise<Redirect[]> {
  return readData<Redirect[]>(REDIRECTS_REL, []);
}

async function writeRedirects(redirects: Redirect[]): Promise<void> {
  await writeData(REDIRECTS_REL, redirects, { message: "chore(backoffice): update redirects" });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------
export async function listArticles(filter: ArticleFilter = {}): Promise<Article[]> {
  const articles = await readArticles();
  const search = filter.search?.trim().toLowerCase();
  return articles
    .filter((a) => {
      if (filter.status && filter.status !== "all") {
        const status = a.status ?? "published";
        if (status !== filter.status) return false;
      }
      if (filter.desk && (a.desk ?? "") !== filter.desk) return false;
      if (filter.category && a.category !== filter.category) return false;
      if (search) {
        const hay = `${a.title} ${a.dek} ${a.category} ${a.slug} ${a.id}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getArticleById(id: string): Promise<Article | null> {
  const articles = await readArticles();
  return articles.find((a) => a.id === id) ?? null;
}

export async function getFacets(): Promise<{ categories: string[]; desks: string[] }> {
  const articles = await readArticles();
  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean))).sort();
  const desks = Array.from(new Set(articles.map((a) => a.desk).filter(Boolean))) as string[];
  return { categories, desks: desks.sort() };
}

export async function countByStatus(): Promise<{ published: number; review: number; total: number }> {
  const articles = await readArticles();
  let published = 0;
  let review = 0;
  for (const a of articles) {
    if ((a.status ?? "published") === "review") review += 1;
    else published += 1;
  }
  return { published, review, total: articles.length };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------
function ensureUniqueSlug(articles: Article[], desired: string, ignoreId?: string): string {
  const base = desired || "story";
  let slug = base;
  let n = 2;
  while (articles.some((a) => a.slug === slug && a.id !== ignoreId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function createArticle(input: Partial<Article>): Promise<Article> {
  const articles = await readArticles();
  const now = new Date().toISOString();
  const title = input.title?.trim() || "Untitled story";
  const slug = ensureUniqueSlug(articles, input.slug ? slugify(input.slug) : slugify(title));
  const id = input.id?.trim() || `bo-${slug}-${Date.now().toString(36)}`;

  const article: Article = {
    id,
    slug,
    title,
    dek: input.dek ?? "",
    category: input.category ?? "Israeli Football",
    kind: input.kind ?? "news",
    publishedAt: input.publishedAt ?? now,
    updatedAt: now,
    readMinutes: input.readMinutes ?? 3,
    source: input.source ?? { name: "", url: "" },
    verificationSources: input.verificationSources ?? [],
    body: input.body ?? [""],
    facts: input.facts ?? [],
    theme: input.theme ?? "night-pitch",
    desk: input.desk ?? "israel",
    status: input.status ?? "review",
    ...stripCoreKeys(input),
  };

  articles.unshift(article);
  await writeArticles(articles);
  return article;
}

// Keep the explicitly-handled keys from being overwritten by the spread above.
function stripCoreKeys(input: Partial<Article>): Partial<Article> {
  const clone: Partial<Article> = { ...input };
  for (const k of [
    "id", "slug", "title", "dek", "category", "kind", "publishedAt", "updatedAt",
    "readMinutes", "source", "verificationSources", "body", "facts", "theme", "desk", "status",
  ] as const) {
    delete clone[k];
  }
  return clone;
}

export async function updateArticle(id: string, patch: Partial<Article>, actor: string): Promise<Article | null> {
  const articles = await readArticles();
  const idx = articles.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const current = articles[idx];

  // Slug change → record a 301 so old URLs keep working.
  let nextSlug = current.slug;
  if (patch.slug && slugify(patch.slug) !== current.slug) {
    nextSlug = ensureUniqueSlug(articles, slugify(patch.slug), id);
    if (nextSlug !== current.slug) {
      await addRedirect(`/article/${current.slug}`, `/article/${nextSlug}`, 301, `slug change by ${actor}`);
    }
  }

  const updated: Article = {
    ...current,
    ...patch,
    id: current.id, // id is immutable
    slug: nextSlug,
    updatedAt: new Date().toISOString(),
  };
  articles[idx] = updated;
  await writeArticles(articles);
  return updated;
}

export async function deleteArticle(id: string): Promise<Article | null> {
  const articles = await readArticles();
  const idx = articles.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const [removed] = articles.splice(idx, 1);
  await writeArticles(articles);
  return removed;
}

export async function setStatus(id: string, status: "published" | "review"): Promise<Article | null> {
  const patch: Partial<Article> = { status };
  // Publishing stamps publishedAt if it was only a draft-time placeholder.
  return updateArticle(id, patch, "system");
}

export async function duplicateArticle(id: string): Promise<Article | null> {
  const articles = await readArticles();
  const source = articles.find((a) => a.id === id);
  if (!source) return null;
  const now = new Date().toISOString();
  const slug = ensureUniqueSlug(articles, `${source.slug}-copy`);
  const copy: Article = {
    ...source,
    id: `bo-${slug}-${Date.now().toString(36)}`,
    slug,
    title: `${source.title} (copy)`,
    status: "review",
    publishedAt: now,
    updatedAt: now,
  };
  articles.unshift(copy);
  await writeArticles(articles);
  return copy;
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------
export async function addRedirect(from: string, to: string, code: 301 | 302, reason?: string): Promise<void> {
  const redirects = await readRedirects();
  const filtered = redirects.filter((r) => r.from !== from);
  filtered.unshift({ from, to, code, createdAt: new Date().toISOString(), reason });
  await writeRedirects(filtered);
}

export async function listRedirects(): Promise<Redirect[]> {
  return readRedirects();
}

export async function findRedirect(fromPath: string): Promise<Redirect | null> {
  const redirects = await readRedirects();
  return redirects.find((r) => r.from === fromPath) ?? null;
}

export async function removeRedirect(fromPath: string): Promise<void> {
  const redirects = await readRedirects();
  await writeRedirects(redirects.filter((r) => r.from !== fromPath));
}
