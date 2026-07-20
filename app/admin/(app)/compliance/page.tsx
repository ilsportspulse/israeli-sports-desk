import { ComplianceManager } from "@/components/admin/compliance-manager";
import { listCorrections } from "@/lib/admin/corrections";
import { getSettings } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const [settings, corrections] = await Promise.all([getSettings(), listCorrections()]);
  return <ComplianceManager initial={settings.compliance} initialCorrections={corrections} />;
}
