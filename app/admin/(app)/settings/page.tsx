import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/admin/settings";
import { listRedirects } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, redirects] = await Promise.all([getSettings(), listRedirects()]);
  return <SettingsForm initial={settings} initialRedirects={redirects} />;
}
