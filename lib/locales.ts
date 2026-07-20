import localeConfigJson from "@/data/locale-config.json";

export type LocaleCode = "en" | "fr" | "es";
export type TextDirection = "ltr" | "rtl";

export type LocaleDefinition = {
  code: LocaleCode;
  bcp47: string;
  label: string;
  nativeLabel: string;
  direction: TextDirection;
  pathPrefix: string | null;
  status: "active" | "prototype" | "planned";
};

const localeConfig = localeConfigJson as {
  defaultLocale: LocaleCode;
  contentTimezone: string;
  locales: LocaleDefinition[];
  fallbacks: Partial<Record<LocaleCode, LocaleCode[]>>;
};

export const defaultLocale = localeConfig.defaultLocale;
export const contentTimezone = localeConfig.contentTimezone;
export const supportedLocales = localeConfig.locales;

/** Locales exposed to the public site (active only), default first. */
export const publicLocales = supportedLocales
  .filter((locale) => locale.status === "active")
  .sort((a, b) => (a.code === defaultLocale ? -1 : b.code === defaultLocale ? 1 : 0));

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return !!value && supportedLocales.some((locale) => locale.code === value);
}

export function getLocaleDefinition(locale: LocaleCode) {
  return supportedLocales.find((item) => item.code === locale) ?? supportedLocales[0];
}

export function getLocaleDirection(locale: LocaleCode): TextDirection {
  return getLocaleDefinition(locale).direction;
}

export function getLocaleFallbacks(locale: LocaleCode) {
  return localeConfig.fallbacks[locale] ?? [];
}

/** Derive the active locale from a request pathname (e.g. "/fr/article/x" -> "fr"). */
export function localeFromPathname(pathname: string): LocaleCode {
  const first = pathname.split("/").filter(Boolean)[0];
  return isLocaleCode(first) && first !== defaultLocale ? first : defaultLocale;
}

/** Remove any locale prefix, returning the canonical (English) path. */
export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length && isLocaleCode(parts[0]) && parts[0] !== defaultLocale) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname === "" ? "/" : pathname;
}

/** Build the public URL path for a given canonical path in a target locale. */
export function pathForLocale(canonicalPath: string, locale: LocaleCode): string {
  const clean = stripLocalePrefix(canonicalPath);
  if (locale === defaultLocale) return clean;
  const prefix = getLocaleDefinition(locale).pathPrefix ?? `/${locale}`;
  return clean === "/" ? prefix : `${prefix}${clean}`;
}

export function formatLocalizedArticleDate(value: string, locale: LocaleCode, compact = false) {
  const definition = getLocaleDefinition(locale);
  return new Intl.DateTimeFormat(definition.bcp47, {
    timeZone: contentTimezone,
    day: "numeric",
    month: compact ? "short" : "long",
    year: compact ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
