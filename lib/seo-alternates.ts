import type { Metadata } from "next";

import { pathForLocale, publicLocales, type LocaleCode } from "@/lib/locales";
import { getRequestLocale } from "@/lib/request-locale";

// Every indexable page must declare a SELF-referencing canonical plus the
// hreflang cluster for its locale variants. Without it, Google sees the same
// document under apex/www and /fr /es prefixes and flags "duplicate without
// user-selected canonical" (GSC warning, 28 Jul). Relative URLs resolve against
// metadataBase (the apex site URL) from the root layout.
export function pageAlternates(canonicalPath: string): NonNullable<Metadata["alternates"]> {
  const locale = getRequestLocale();
  const languages: Record<string, string> = { "x-default": canonicalPath };
  for (const { code } of publicLocales as Array<{ code: LocaleCode }>) {
    languages[code] = pathForLocale(canonicalPath, code);
  }
  return { canonical: pathForLocale(canonicalPath, locale), languages };
}
