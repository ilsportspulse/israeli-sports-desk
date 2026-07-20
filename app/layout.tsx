import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo, Inter } from "next/font/google";

import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { siteConfig } from "@/config/site";
import { getSettings } from "@/lib/admin/settings";
import { getLocaleDefinition } from "@/lib/locales";
import { getRequestLocale } from "@/lib/request-locale";

import "./globals.css";

// Self-hosted at build time (no external CDN at runtime). Archivo = display
// headlines (ESPN-style), Inter = body/UI. Exposed as CSS variables.
const archivo = Archivo({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-archivo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Metadata is built from backoffice-editable settings (with siteConfig as the
// seed), so branding/SEO defaults are never hardcoded. Read at build time — this
// bakes the values into the static pages without forcing dynamic rendering.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const localeDef = getLocaleDefinition(getRequestLocale());
  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: { default: s.seo.defaultTitle, template: s.seo.titleTemplate },
    description: s.seo.defaultDescription,
    applicationName: s.branding.siteName,
    // No global canonical here: setting one on the root layout makes EVERY page
    // canonicalise to it. Each route declares its own canonical (home below,
    // articles in their generateMetadata); pages without one fall back to their
    // own URL, which is correct.
    alternates: {
      types: { "application/rss+xml": `${base}/feed.xml` },
    },
    openGraph: {
      type: "website",
      locale: localeDef.bcp47.replace("-", "_"),
      url: siteConfig.siteUrl,
      siteName: s.branding.siteName,
      title: s.seo.defaultTitle,
      description: s.seo.defaultDescription,
      images: s.seo.defaultOgImage ? [{ url: s.seo.defaultOgImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: s.seo.twitterHandle,
      creator: s.seo.twitterHandle,
      title: s.seo.defaultTitle,
      description: s.seo.defaultDescription,
    },
    robots: s.seo.indexable
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
        }
      : { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e16" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const localeDef = getLocaleDefinition(getRequestLocale());
  const twitterUrl = `https://x.com/${s.seo.twitterHandle.replace(/^@/, "")}`;
  const logo = s.branding.logoUrl.startsWith("http") ? s.branding.logoUrl : `${base}${s.branding.logoUrl}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      name: s.branding.siteName,
      alternateName: s.branding.shortName,
      url: base,
      logo,
      description: s.branding.description,
      areaServed: "Israel",
      inLanguage: localeDef.code,
      sameAs: [twitterUrl],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: s.branding.siteName,
      url: base,
      inLanguage: localeDef.code,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${base}/stories?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
      publisher: { "@type": "NewsMediaOrganization", name: s.branding.siteName },
    },
  ];

  return (
    <html lang={localeDef.code} dir={localeDef.direction} className={`${inter.variable} ${archivo.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <MobileBottomNav />
        <AnalyticsBeacon />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
