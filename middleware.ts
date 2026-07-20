import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Two responsibilities:
//  1. Coarse edge gate for the backoffice (session-cookie presence only; the
//     authoritative signature/expiry check runs server-side in requireAdmin /
//     getApiAdmin). Defence in depth.
//  2. Locale routing: requests under /fr or /es are rewritten to the canonical
//     (English) route with an `x-ilsp-locale` header so Server Components can
//     render the right language. The browser URL keeps its locale prefix, giving
//     each language a distinct, indexable URL for hreflang/SEO.

const SESSION_COOKIE = "ilsp_admin";
const LOCALE_HEADER = "x-ilsp-locale";
const LOCALE_PREFIXES = new Set(["fr", "es"]);

// Paths reachable without a session.
const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/manifest.webmanifest",
  "/api/admin/login",
  "/api/admin/logout",
]);

function handleAdmin(req: NextRequest, pathname: string): NextResponse {
  const isAdminApi = pathname.startsWith("/api/admin");
  const allowlisted = PUBLIC_ADMIN_PATHS.has(pathname);
  const hasCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (!allowlisted && !hasCookie) {
    if (isAdminApi) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  // The whole backoffice must never be indexed or framed.
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return handleAdmin(req, pathname);
  }

  // Locale prefix? e.g. /fr, /es, /fr/article/x
  const segments = pathname.split("/");
  const first = segments[1];
  if (LOCALE_PREFIXES.has(first)) {
    const rest = "/" + segments.slice(2).join("/");
    const url = req.nextUrl.clone();
    url.pathname = rest === "/" ? "/" : rest.replace(/\/$/, "");
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(LOCALE_HEADER, first);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  // Run on admin, the locale prefixes, and pass everything else through the
  // negative lookahead so static assets/_next are never touched.
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/fr/:path*",
    "/es/:path*",
    "/fr",
    "/es",
  ],
};
