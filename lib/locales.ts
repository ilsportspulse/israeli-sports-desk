import localeConfigJson from "@/data/locale-config.json";

export type LocaleCode = "en" | "he";
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

export function isLocaleCode(value: string): value is LocaleCode {
  return supportedLocales.some((locale) => locale.code === value);
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
