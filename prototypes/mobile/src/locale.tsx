import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { ApiLocale } from "../../../packages/api-contracts/src";

export const PUBLIC_LAUNCH_LOCALES = ["en"] as const;
const hebrewPrototypeEnabled = __DEV__ && process.env.EXPO_PUBLIC_ENABLE_HEBREW_PROTOTYPE === "true";

const copy = {
  en: {
    brand: "Israel Sports Pulse",
    subtitle: "The beat of Israeli sport",
    latest: "Latest",
    scores: "Scores",
    scheduled: "Scheduled",
    read: "min read",
    back: "Back to latest",
    keyDetails: "Key details",
    englishArticle: "Full article in English",
    language: "עברית · prototype",
    empty: "No published stories are available.",
  },
  he: {
    brand: "ישראל ספורטס פולס",
    subtitle: "הדופק של הספורט הישראלי",
    latest: "חדשות אחרונות",
    scores: "תוצאות ומשחקים",
    scheduled: "מתוכנן",
    read: "דקות קריאה",
    back: "חזרה לחדשות",
    keyDetails: "נקודות מרכזיות",
    englishArticle: "הכתבה המלאה באנגלית",
    language: "English · prototype",
    empty: "אין כתבות זמינות כרגע.",
  },
} as const;

type LocaleContextValue = {
  locale: ApiLocale;
  isRtl: boolean;
  labels: (typeof copy)[ApiLocale];
  canPreviewPrototypeLocale: boolean;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<ApiLocale>("en");
  const value = useMemo(
    () => ({
      locale,
      isRtl: locale === "he",
      labels: copy[locale],
      canPreviewPrototypeLocale: hebrewPrototypeEnabled,
      toggleLocale: () => {
        if (!hebrewPrototypeEnabled) return;
        setLocale((current) => (current === "en" ? "he" : "en"));
      },
    }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}

export function useDirectionStyle() {
  const { isRtl } = useLocale();
  return useMemo(
    () => ({
      writingDirection: isRtl ? ("rtl" as const) : ("ltr" as const),
      textAlign: isRtl ? ("right" as const) : ("left" as const),
    }),
    [isRtl],
  );
}
