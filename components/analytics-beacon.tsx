"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Cookieless page-view beacon. Sends one fire-and-forget event per view via
// navigator.sendBeacon (falls back to fetch). No personal data leaves the browser
// beyond the URL/referrer the reader already sent.
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const last = useRef<string>("");

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    if (pathname.startsWith("/admin")) return;

    const params = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      path: pathname,
      title: document.title,
      ref: document.referrer || undefined,
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
      }
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
