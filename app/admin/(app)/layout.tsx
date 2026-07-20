import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/admin/auth";
import { countByStatus } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

// Guarded shell for every authenticated backoffice page. requireAdmin() redirects
// to /admin/login when there is no valid session.
export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const session = requireAdmin();
  const counts = await countByStatus().catch(() => ({ published: 0, review: 0, total: 0 }));

  return (
    <div className="shell">
      <AdminSidebar username={session.sub} reviewCount={counts.review} />
      <div className="main">{children}</div>
    </div>
  );
}
