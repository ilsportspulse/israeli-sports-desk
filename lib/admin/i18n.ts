import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Backoffice management of the existing locale config (data/locale-config.json):
// default locale + per-locale status. The reader stack (lib/locales.ts) already
// consumes this file, so changes here take effect on redeploy.

const REL = path.join(process.cwd(), "data", "locale-config.json");

export type LocaleEntry = {
  code: string; bcp47: string; label: string; nativeLabel: string;
  direction: "ltr" | "rtl"; pathPrefix: string | null; status: "active" | "prototype" | "planned";
};
export type LocaleConfig = { defaultLocale: string; contentTimezone: string; locales: LocaleEntry[]; [k: string]: unknown };

export async function getLocaleConfig(): Promise<LocaleConfig> {
  return JSON.parse(await readFile(REL, "utf8"));
}

export async function updateLocaleConfig(patch: { defaultLocale?: string; statuses?: Record<string, LocaleEntry["status"]> }): Promise<LocaleConfig> {
  const cfg = await getLocaleConfig();
  if (patch.defaultLocale) cfg.defaultLocale = patch.defaultLocale;
  if (patch.statuses) {
    cfg.locales = cfg.locales.map((l) => (patch.statuses![l.code] ? { ...l, status: patch.statuses![l.code] } : l));
  }
  await writeFile(REL, JSON.stringify(cfg, null, 2) + "\n", "utf8");
  return cfg;
}
