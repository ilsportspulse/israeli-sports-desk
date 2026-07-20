import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { siteConfig } from "@/config/site";
import { classifyReferrer, dailyVisitorId, parseUserAgent, recordEvent } from "@/lib/analytics/track";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0].trim()) || req.headers.get("x-real-ip") || "0.0.0.0";
}

// Public, cookieless pixel/beacon. Fire-and-forget: always returns 204 so it never
// affects the reader experience.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pathHit = typeof body.path === "string" ? body.path.slice(0, 300) : "/";
    if (pathHit.startsWith("/admin") || pathHit.startsWith("/api")) return new NextResponse(null, { status: 204 });

    const ua = req.headers.get("user-agent") || "";
    const ip = clientIp(req);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const host = new URL(siteConfig.siteUrl).hostname;

    const { refType, refDomain } = classifyReferrer(typeof body.ref === "string" ? body.ref : undefined, host);
    const { device, os, browser, bot } = parseUserAgent(ua);

    await recordEvent({
      ts: now.toISOString(),
      day,
      vid: dailyVisitorId(ip, ua, day),
      path: pathHit,
      title: typeof body.title === "string" ? body.title.slice(0, 200) : undefined,
      refType,
      refDomain,
      utmSource: typeof body.utmSource === "string" ? body.utmSource.slice(0, 60) : undefined,
      utmMedium: typeof body.utmMedium === "string" ? body.utmMedium.slice(0, 60) : undefined,
      utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign.slice(0, 60) : undefined,
      device,
      os,
      browser,
      // Geo comes from the edge/CDN headers in production (Vercel / Cloudflare).
      country: req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || undefined,
      city: req.headers.get("x-vercel-ip-city") || undefined,
      bot,
    });
  } catch {
    /* never surface analytics errors to visitors */
  }
  return new NextResponse(null, { status: 204 });
}
