import { AffiliationManager } from "@/components/admin/affiliation-manager";
import { getAffiliation } from "@/lib/admin/affiliation";

export const dynamic = "force-dynamic";

export default async function MonetisationPage() {
  return <AffiliationManager initial={await getAffiliation()} />;
}
