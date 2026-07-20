import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./admin.css";

export const metadata: Metadata = {
  title: "ILSP Backoffice",
  robots: { index: false, follow: false, nocache: true },
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ILSP Admin", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#07142c",
};

// Root wrapper for the whole /admin tree. No auth guard here (so /admin/login is
// reachable); the guard lives in the (app) group layout. Everything is scoped
// under .ilsp-admin so admin CSS never leaks to the public site.
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="ilsp-admin">{children}</div>;
}
