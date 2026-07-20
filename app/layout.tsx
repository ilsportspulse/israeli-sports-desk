import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${siteConfig.siteUrl.replace(/\/$/, "")}/feed.xml` },
  },
  openGraph: {
    type: "website",
    locale: "en_IL",
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.socialHandle,
    creator: siteConfig.socialHandle,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e16" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const twitterUrl = `https://x.com/${siteConfig.socialHandle.replace(/^@/, "")}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      name: siteConfig.name,
      alternateName: siteConfig.shortName,
      url: base,
      logo: `${base}/brand/ilsp-mark.svg`,
      description: siteConfig.description,
      areaServed: "Israel",
      inLanguage: "en",
      sameAs: [twitterUrl],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: base,
      inLanguage: "en",
      publisher: { "@type": "NewsMediaOrganization", name: siteConfig.name },
    },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
