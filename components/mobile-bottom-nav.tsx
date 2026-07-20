"use client";

import { usePathname } from "next/navigation";

import { IsraelFlagIcon } from "@/components/icons";
import { LocalizedLink as Link } from "@/components/localized-link";
import { NavGlobe, NavHome, NavRetro, NavScores } from "@/components/nav-icons";
import { translator } from "@/lib/i18n/ui";
import { localeFromPathname, stripLocalePrefix } from "@/lib/locales";

// Persistent bottom navigation shown on every page (mobile). Rendered once in the
// root layout so it survives navigation. Locale + active tab are derived from the
// URL so it needs no props.
export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const tr = translator(localeFromPathname(pathname));
  const path = stripLocalePrefix(pathname);

  const isHome = path === "/";
  const isRetro = path.startsWith("/archive");
  const isScores = path.startsWith("/scores") || path.startsWith("/competition");

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link href="/" className={isHome ? "active" : ""}><NavHome active={isHome} /><span>{tr("nav.home")}</span></Link>
      <Link href="/#latest"><IsraelFlagIcon /><span>{tr("nav.israel")}</span></Link>
      <Link href="/#international"><NavGlobe /><span>{tr("nav.international")}</span></Link>
      <Link href="/archive" className={isRetro ? "active" : ""}><NavRetro active={isRetro} /><span>{tr("nav.archive")}</span></Link>
      <Link href="/scores" className={isScores ? "active" : ""}><NavScores active={isScores} /><span>{tr("nav.scores")}</span></Link>
    </nav>
  );
}
