import type { MediaAsset } from "@/lib/types";
import { readData, writeData } from "@/lib/admin/persist";

// The media library is the article-media map (data/article-media.json): a record
// keyed by article id → MediaAsset. Every image carries full attribution and a
// caption; the library enforces those, flags duplicate credits and guards against
// captions that would falsely claim to depict the event.

const MEDIA_REL = "data/article-media.json";

export type MediaEntry = MediaAsset & { key: string };

// Captions that (mis)claim a file/illustration IS the real event — banned so the
// editorial "file photograph" honesty rule can't be broken from the library.
const FORBIDDEN_CAPTION = [
  /\bpictured (?:here|above)\b/i,
  /\bduring the (?:match|game|reported)\b/i,
  /\bmoments (?:after|before) the\b/i,
];

async function readMedia(): Promise<Record<string, MediaAsset>> {
  return readData<Record<string, MediaAsset>>(MEDIA_REL, {});
}

async function writeMedia(map: Record<string, MediaAsset>, actor: string): Promise<void> {
  await writeData(MEDIA_REL, map, { actor, message: `chore(backoffice): media update by ${actor}` });
}

export async function listMedia(search?: string): Promise<MediaEntry[]> {
  const map = await readMedia();
  const q = search?.trim().toLowerCase();
  return Object.entries(map)
    .map(([key, asset]) => ({ key, ...asset }))
    .filter((e) => {
      if (!q) return true;
      return `${e.key} ${e.alt} ${e.caption} ${e.credit} ${e.creditUrl}`.toLowerCase().includes(q);
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

export async function getMedia(key: string): Promise<MediaEntry | null> {
  const map = await readMedia();
  return map[key] ? { key, ...map[key] } : null;
}

export async function updateMedia(key: string, patch: Partial<MediaAsset>, actor: string): Promise<MediaEntry | null> {
  const map = await readMedia();
  if (!map[key]) return null;
  map[key] = { ...map[key], ...patch };
  await writeMedia(map, actor);
  return { key, ...map[key] };
}

export async function deleteMedia(key: string, actor: string): Promise<boolean> {
  const map = await readMedia();
  if (!map[key]) return false;
  delete map[key];
  await writeMedia(map, actor);
  return true;
}

export async function addMedia(key: string, asset: MediaAsset, actor: string): Promise<MediaEntry> {
  const map = await readMedia();
  map[key] = asset;
  await writeMedia(map, actor);
  return { key, ...asset };
}

// ---- Guards / validation ----
export type MediaIssue = { key: string; severity: "error" | "warning"; message: string };

export async function auditMedia(): Promise<{ issues: MediaIssue[]; duplicateCredits: Record<string, string[]> }> {
  const map = await readMedia();
  const issues: MediaIssue[] = [];
  const creditToKeys: Record<string, string[]> = {};

  for (const [key, a] of Object.entries(map)) {
    if (a.creditUrl) (creditToKeys[a.creditUrl] ??= []).push(key);
    if (!a.alt?.trim()) issues.push({ key, severity: "error", message: "Missing alt text (accessibility + SEO)." });
    if (!a.credit?.trim()) issues.push({ key, severity: "error", message: "Missing credit." });
    if (!a.creditUrl?.trim()) issues.push({ key, severity: "error", message: "Missing credit URL." });
    if (!a.license?.trim()) issues.push({ key, severity: "warning", message: "Missing licence." });
    if (a.caption && FORBIDDEN_CAPTION.some((re) => re.test(a.caption))) {
      issues.push({ key, severity: "error", message: "Caption may falsely claim the image depicts the event." });
    }
  }

  const duplicateCredits = Object.fromEntries(Object.entries(creditToKeys).filter(([, keys]) => keys.length > 1));
  for (const [url, keys] of Object.entries(duplicateCredits)) {
    issues.push({ key: keys.join(", "), severity: "warning", message: `Credit URL reused by ${keys.length} articles: ${url}` });
  }

  return { issues, duplicateCredits };
}

export function validateCaption(caption: string): string | null {
  const hit = FORBIDDEN_CAPTION.find((re) => re.test(caption));
  return hit ? "Caption may falsely claim the image depicts the event." : null;
}
