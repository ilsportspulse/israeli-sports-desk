"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { localeFromPathname, pathForLocale } from "@/lib/locales";

type LinkProps = ComponentProps<typeof Link>;

// Drop-in replacement for next/link that keeps the reader inside their current
// language. Internal absolute paths ("/", "/article/x", "/#latest") are rewritten
// to the active locale's prefix; external URLs, mailto:, tel: and bare hashes
// pass through untouched. Import it *as* Link to localise every link in a tree.
export function LocalizedLink({ href, ...props }: LinkProps) {
  const pathname = usePathname() || "/";
  const locale = localeFromPathname(pathname);

  let resolved = href;
  if (typeof href === "string" && href.startsWith("/")) {
    resolved = pathForLocale(href, locale);
  }

  return <Link href={resolved} {...props} />;
}
