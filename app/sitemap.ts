import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getArticles } from "@/lib/articles";

const BASE = siteConfig.siteUrl.replace(/\/$/, "");

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/stories", changeFrequency: "hourly", priority: 0.9 },
  { path: "/scores", changeFrequency: "hourly", priority: 0.9 },
  { path: "/columns", changeFrequency: "daily", priority: 0.7 },
  { path: "/archive", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/corrections", changeFrequency: "weekly", priority: 0.4 },
  { path: "/commercial-independence", changeFrequency: "monthly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/brand", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: `${BASE}${entry.path === "/" ? "" : entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  const articleEntries: MetadataRoute.Sitemap = getArticles().filter((article) => !article.seo?.noindex).map((article) => {
    const lastModified = article.updatedAt ?? article.publishedAt;
    return {
      url: `${BASE}/article/${article.slug}`,
      lastModified: lastModified ? new Date(lastModified) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  return [...staticEntries, ...articleEntries];
}
