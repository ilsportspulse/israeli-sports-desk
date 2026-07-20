import { headers } from "next/headers";

import { defaultLocale, isLocaleCode, type LocaleCode } from "@/lib/locales";

// Middleware sets `x-ilsp-locale` when a request comes in under a locale prefix
// (/fr, /es) and rewrites the URL to the canonical route. Server Components read
// the active locale from that header. Absent header => English (default).
export const LOCALE_HEADER = "x-ilsp-locale";

export function getRequestLocale(): LocaleCode {
  const value = headers().get(LOCALE_HEADER);
  return isLocaleCode(value) ? value : defaultLocale;
}
