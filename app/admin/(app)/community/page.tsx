import { CommunityManager } from "@/components/admin/community-manager";
import { getCommunity } from "@/lib/admin/community";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  return <CommunityManager initial={await getCommunity()} />;
}
