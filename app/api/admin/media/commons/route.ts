import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getApiAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

// Search Wikimedia Commons (free/public API) for correctly-licensed photos, with
// attribution + licence pre-filled so the editor can insert a compliant image.
function stripHtml(s?: string): string {
  return (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query", format: "json", generator: "search",
    gsrsearch: `filetype:bitmap ${q}`, gsrnamespace: "6", gsrlimit: "12",
    prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "320",
  }).toString();

  try {
    const res = await fetch(api.toString(), { headers: { "User-Agent": "ilsp-backoffice/1.0 (media search)" }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ results: [], error: `Commons ${res.status}` }, { status: 502 });
    const data = await res.json();
    const pages = data?.query?.pages ? Object.values<Record<string, unknown>>(data.query.pages) : [];
    const results = pages
      .map((p) => {
        const info = (p as { imageinfo?: Record<string, unknown>[] }).imageinfo?.[0] as Record<string, unknown> | undefined;
        if (!info) return null;
        const meta = (info.extmetadata as Record<string, { value?: string }>) || {};
        return {
          title: (p as { title?: string }).title?.replace(/^File:/, "") ?? "",
          pageUrl: info.descriptionurl as string,
          fullUrl: info.url as string,
          thumbUrl: (info.thumburl as string) || (info.url as string),
          width: info.width as number,
          height: info.height as number,
          credit: stripHtml(meta.Artist?.value) || "Wikimedia Commons",
          license: stripHtml(meta.LicenseShortName?.value) || "",
          licenseUrl: (meta.LicenseUrl?.value as string) || "",
        };
      })
      .filter(Boolean);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ results: [], error: (err as Error).message }, { status: 502 });
  }
}
