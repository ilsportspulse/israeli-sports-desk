import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#07142c",
    lang: "en",
    categories: ["news", "sports"],
    icons: [
      { src: "/brand/ilsp-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/brand/ilsp-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
