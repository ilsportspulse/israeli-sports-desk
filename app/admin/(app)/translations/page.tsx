import { TranslationsManager } from "@/components/admin/translations-manager";
import { getLocaleConfig } from "@/lib/admin/i18n";
import { countByStatus } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function TranslationsPage() {
  const [config, counts] = await Promise.all([getLocaleConfig(), countByStatus()]);
  // English is the source language, so its coverage equals the published set.
  const coverage: Record<string, number> = { [config.defaultLocale]: counts.published };
  return <TranslationsManager initial={config} coverage={coverage} />;
}
