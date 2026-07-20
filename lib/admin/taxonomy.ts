import { readData, writeData } from "@/lib/admin/persist";
import { getFacets } from "@/lib/admin/store";

// Backoffice-editable taxonomy: category order/labels/importance/desk + the site
// navigation menu + homepage featured pins. Seeded from the live article
// categories the first time so nothing has to be entered by hand.

const TAXONOMY_REL = "data/taxonomy.json";

export type CategoryConfig = {
  name: string; // canonical category value used on articles
  label?: string; // optional display override
  desk?: string; // israel | international | world
  order: number;
  importance?: number; // 1-3, higher = more prominent
  hidden?: boolean; // hide from public nav/tabs
};

export type NavItem = { label: string; href: string; order: number };

export type TaxonomyConfig = {
  categories: CategoryConfig[];
  nav: NavItem[];
  featuredSlugs: string[];
  updatedAt?: string;
  updatedBy?: string;
};

const DEFAULT_NAV: NavItem[] = [
  { label: "Home", href: "/", order: 0 },
  { label: "Stories", href: "/stories", order: 1 },
  { label: "Scores", href: "/scores", order: 2 },
  { label: "Columns", href: "/columns", order: 3 },
  { label: "Archive", href: "/archive", order: 4 },
  { label: "About", href: "/about", order: 5 },
];

export async function getTaxonomy(): Promise<TaxonomyConfig> {
  const stored = await readData<Partial<TaxonomyConfig> | null>(TAXONOMY_REL, null);
  const facets = await getFacets().catch(() => ({ categories: [] as string[], desks: [] as string[] }));

  // Merge stored config with any newly-appeared categories so the list is always complete.
  const storedCats = stored?.categories ?? [];
  const known = new Set(storedCats.map((c) => c.name));
  const merged: CategoryConfig[] = [...storedCats];
  let nextOrder = storedCats.length;
  for (const name of facets.categories) {
    if (!known.has(name)) merged.push({ name, order: nextOrder++, importance: 2 });
  }
  merged.sort((a, b) => a.order - b.order);

  return {
    categories: merged,
    nav: (stored?.nav && stored.nav.length ? stored.nav : DEFAULT_NAV).slice().sort((a, b) => a.order - b.order),
    featuredSlugs: stored?.featuredSlugs ?? [],
    updatedAt: stored?.updatedAt,
    updatedBy: stored?.updatedBy,
  };
}

export async function updateTaxonomy(patch: Partial<TaxonomyConfig>, actor: string): Promise<TaxonomyConfig> {
  const current = await getTaxonomy();
  const next: TaxonomyConfig = {
    categories: patch.categories ?? current.categories,
    nav: patch.nav ?? current.nav,
    featuredSlugs: patch.featuredSlugs ?? current.featuredSlugs,
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  await writeData(TAXONOMY_REL, next, { actor, message: `chore(backoffice): taxonomy update by ${actor}` });
  return next;
}

// Public-site helper: ordered list of visible category names (falls back to []).
export async function getCategoryOrder(): Promise<string[]> {
  const tax = await readData<Partial<TaxonomyConfig> | null>(TAXONOMY_REL, null);
  if (!tax?.categories) return [];
  return tax.categories.filter((c) => !c.hidden).sort((a, b) => a.order - b.order).map((c) => c.name);
}
