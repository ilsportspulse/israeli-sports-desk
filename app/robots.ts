import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

const BASE = siteConfig.siteUrl.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Never expose the admin backoffice or internal APIs to crawlers.
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: [`${BASE}/sitemap.xml`, `${BASE}/news-sitemap.xml`],
    host: BASE,
  };
}
