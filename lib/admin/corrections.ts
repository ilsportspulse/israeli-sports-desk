import { readData, writeData } from "@/lib/admin/persist";

// Public corrections log. Corrections are content (low volume) so they live in
// git alongside the articles they amend, and render as a visible notice on the
// corrected article — the transparency the editorial policy promises.

const CORRECTIONS_REL = "data/corrections.json";

export type Correction = {
  id: string;
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  note: string;
  correctedAt: string;
  by: string;
};

export async function listCorrections(): Promise<Correction[]> {
  const list = await readData<Correction[]>(CORRECTIONS_REL, []);
  return list.sort((a, b) => new Date(b.correctedAt).getTime() - new Date(a.correctedAt).getTime());
}

export async function getCorrectionsForArticle(articleId: string): Promise<Correction[]> {
  return (await listCorrections()).filter((c) => c.articleId === articleId);
}

export async function addCorrection(input: Omit<Correction, "id" | "correctedAt">): Promise<Correction> {
  const list = await readData<Correction[]>(CORRECTIONS_REL, []);
  const correction: Correction = {
    ...input,
    id: `corr-${Date.now().toString(36)}`,
    correctedAt: new Date().toISOString(),
  };
  list.unshift(correction);
  await writeData(CORRECTIONS_REL, list, { actor: input.by, message: `content: correction on ${input.articleSlug}` });
  return correction;
}

export async function deleteCorrection(id: string, actor: string): Promise<boolean> {
  const list = await readData<Correction[]>(CORRECTIONS_REL, []);
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  await writeData(CORRECTIONS_REL, next, { actor, message: "content: remove correction" });
  return true;
}
