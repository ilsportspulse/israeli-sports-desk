"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = { href: string; label: string; icon: string; badge?: number };

const CONTENT: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/articles", label: "Articles", icon: "▤" },
  { href: "/admin/review", label: "Review queue", icon: "◷" },
  { href: "/admin/newsroom", label: "AI newsroom", icon: "✳" },
  { href: "/admin/media", label: "Media library", icon: "▨" },
  { href: "/admin/social", label: "Social hub", icon: "◎" },
  { href: "/admin/notifications", label: "Notifications", icon: "◕" },
  { href: "/admin/community", label: "Community", icon: "◍" },
];

const SYSTEM: NavItem[] = [
  { href: "/admin/analytics", label: "Analytics", icon: "◔" },
  { href: "/admin/monetisation", label: "Monetisation", icon: "$" },
  { href: "/admin/taxonomy", label: "Taxonomy", icon: "❏" },
  { href: "/admin/seo", label: "SEO", icon: "⌁" },
  { href: "/admin/translations", label: "Translations", icon: "⟐" },
  { href: "/admin/compliance", label: "Compliance", icon: "§" },
  { href: "/admin/audit", label: "Audit log", icon: "◈" },
  { href: "/admin/security", label: "Access & security", icon: "⚿" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
  { href: "/admin/system", label: "System", icon: "▤" },
];

// Roadmap modules — shown so the shape of the platform is visible; wired in later phases.
export function AdminSidebar({ username, reviewCount }: { username: string; reviewCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <div className="mobile-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/brand/ilsp-mark.svg" alt="ILSP" />
        <div className="brand-text"><b>Backoffice</b></div>
        <button className="hamburger" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>☰</button>
      </div>
      <div className={`backdrop${open ? " show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand-logo" src="/brand/ilsp-mark.svg" alt="ILSP" />
        <div className="brand-text">
          <b>Backoffice</b>
          <span>Israel Sports Pulse</span>
        </div>
      </div>

      <div className="nav-group">Content</div>
      {CONTENT.map((item) => (
        <a key={item.href} href={item.href} className={`nav-link${isActive(item.href) ? " active" : ""}`}>
          <span className="ic">{item.icon}</span>
          {item.label}
          {item.href === "/admin/review" && reviewCount > 0 && <span className="nav-badge">{reviewCount}</span>}
        </a>
      ))}

      <div className="nav-group">System</div>
      {SYSTEM.map((item) => (
        <a key={item.href} href={item.href} className={`nav-link${isActive(item.href) ? " active" : ""}`}>
          <span className="ic">{item.icon}</span>
          {item.label}
        </a>
      ))}

      <div style={{ flex: 1 }} />
      <button className="btn ghost" onClick={logout} style={{ color: "#cdd6e6", justifyContent: "flex-start" }}>
        <span className="ic">⏻</span> Sign out ({username})
      </button>
    </aside>
    </>
  );
}
