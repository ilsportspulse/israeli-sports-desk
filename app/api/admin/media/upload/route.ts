import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { addMedia, getMedia, validateCaption } from "@/lib/admin/media-store";
import { writeBinaryData } from "@/lib/admin/persist";
import type { MediaAsset } from "@/lib/types";

export const runtime = "nodejs";

// Manual image upload. Stores the file under public/uploads/ (committed to the
// repo in production, like every other backoffice write) and registers a media
// entry with full attribution. 4 MB cap — Vercel rejects larger request bodies.
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session || !can(session.role, "media.manage")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file supplied." }, { status: 400 });
  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "Only JPEG, PNG, WebP or GIF images are allowed." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image too large (max 4 MB)." }, { status: 400 });

  const key = (form.get("key")?.toString() ?? "").trim();
  if (!key) return NextResponse.json({ error: "Key is required (article id, or any unique library name)." }, { status: 400 });
  // Uploading to a key that already has an image REPLACES it — that is what an
  // editor attaching a new photo means. The previous entry's attribution is
  // reused as fallback so a quick swap never fails on missing fields.
  const previous = await getMedia(key);

  const alt = (form.get("alt")?.toString() ?? "").trim()
    || previous?.alt
    || key.replace(/^live-|^archive-|^column-/, "").replace(/\d{4}-?\d{2}-?\d{2}-?/, "").replace(/-/g, " ").trim()
    || "Story image";
  const caption = (form.get("caption")?.toString() ?? "").trim();
  const captionIssue = caption ? validateCaption(caption) : null;
  if (captionIssue) return NextResponse.json({ error: captionIssue }, { status: 400 });

  const rel = `public/uploads/${Date.now()}-${slugify(file.name)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await writeBinaryData(rel, buffer, { actor: session.sub, message: `chore(backoffice): image upload by ${session.sub}` });
  } catch (err) {
    return NextResponse.json({ error: `Could not store the file: ${(err as Error).message}` }, { status: 500 });
  }

  const asset: MediaAsset = {
    src: rel.replace(/^public/, ""),
    alt,
    caption,
    credit: (form.get("credit")?.toString() ?? "").trim() || previous?.credit || "X.com",
    creditUrl: (form.get("creditUrl")?.toString() ?? "").trim() || `https://ilsportspulse.com/#${Date.now()}`,
    license: (form.get("license")?.toString() ?? "").trim() || previous?.license || "All rights reserved",
    licenseUrl: (form.get("licenseUrl")?.toString() ?? "").trim() || previous?.licenseUrl || "",
  };
  const entry = await addMedia(key, asset, session.sub);
  await recordAudit({ actor: session.sub, action: "media.upload", summary: `Uploaded ${asset.src} as ${key}` });

  // In production the file ships with the next deploy triggered by the commit —
  // tell the editor so a briefly-broken preview isn't mistaken for a failure.
  const deferred = Boolean(process.env.VERCEL);
  return NextResponse.json({ entry, deferred });
}
