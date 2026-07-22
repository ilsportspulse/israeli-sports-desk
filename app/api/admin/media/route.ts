import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { addMedia, auditMedia, getMedia, listMedia, validateCaption } from "@/lib/admin/media-store";
import type { MediaAsset } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const search = req.nextUrl.searchParams.get("search") || undefined;
  const [media, audit] = await Promise.all([listMedia(search), auditMedia()]);
  return NextResponse.json({ media, issues: audit.issues });
}

// Create a media entry from an existing src + attribution — used by the article
// editor's "use this image" picker (assigning a library image to an article id).
export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session || !can(session.role, "media.manage")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Partial<MediaAsset> & { key?: string; fromKey?: string; replace?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const key = (body.key ?? "").trim();
  if (!key) return NextResponse.json({ error: "Key is required." }, { status: 400 });
  if (!body.replace && (await getMedia(key))) {
    return NextResponse.json({ error: `"${key}" already has an image.` }, { status: 409 });
  }

  // Copy from an existing entry, with optional field overrides on top.
  const base = body.fromKey ? await getMedia(body.fromKey) : null;
  if (body.fromKey && !base) return NextResponse.json({ error: "Source image not found." }, { status: 404 });

  const asset: MediaAsset = {
    src: (body.src ?? base?.src ?? "").trim(),
    alt: (body.alt ?? base?.alt ?? "").trim(),
    caption: (body.caption ?? base?.caption ?? "").trim(),
    credit: (body.credit ?? base?.credit ?? "").trim(),
    creditUrl: (body.creditUrl ?? base?.creditUrl ?? "").trim(),
    license: (body.license ?? base?.license ?? "").trim(),
    licenseUrl: (body.licenseUrl ?? base?.licenseUrl ?? "").trim(),
    ...(base?.width ? { width: base.width } : {}),
    ...(base?.height ? { height: base.height } : {}),
    ...(base?.focalPoint ? { focalPoint: base.focalPoint } : {}),
  };
  if (!asset.src) return NextResponse.json({ error: "src (or fromKey) is required." }, { status: 400 });
  if (!asset.alt) return NextResponse.json({ error: "Alt text is required." }, { status: 400 });
  const captionIssue = asset.caption ? validateCaption(asset.caption) : null;
  if (captionIssue) return NextResponse.json({ error: captionIssue }, { status: 422 });

  const entry = await addMedia(key, asset, session.sub);
  await recordAudit({ actor: session.sub, action: "media.assign", target: key, summary: `Assigned image to ${key}` });
  return NextResponse.json({ entry });
}
