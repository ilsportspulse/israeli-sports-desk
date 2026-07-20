import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

const BASE = siteConfig.siteUrl.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Never expose the admin backoffice, internal APIs or the Hebrew prototype to crawlers.
        disallow: ["/admin", "/api/", "/he-preview"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
