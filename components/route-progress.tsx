"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// A thin top progress bar that gives immediate feedback on every in-app
// navigation (including the language switch), so dynamic pages feel responsive
// while their server render is fetched. No dependency; pure App-Router client hooks.
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  // A navigation just completed (pathname changed) → finish the bar.
  useEffect(() => {
    setActive(false);
  }, [pathname]);

  // Start the bar the moment the reader clicks an internal link.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      let dest: URL;
      try {
        dest = new URL(anchor.href);
      } catch {
        return;
      }
      if (dest.origin !== window.location.origin) return;
      if (dest.pathname === window.location.pathname && dest.search === window.location.search) return;
      setActive(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <span className={`route-progress${active ? " on" : ""}`} aria-hidden="true" />;
}
