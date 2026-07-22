import { SecurityManager } from "@/components/admin/security-manager";
import { UsersManager } from "@/components/admin/users-manager";
import { ROLE_LABELS, getCurrentAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const ROLES: { role: keyof typeof ROLE_LABELS; can: string }[] = [
  { role: "admin", can: "Everything — content, media, settings, automation, users, moderation" },
  { role: "editor", can: "Content, media, publish, automation, moderation (no settings/users)" },
  { role: "contributor", can: "Draft & edit articles, manage media (cannot publish)" },
  { role: "readonly", can: "View only" },
];

export default function SecurityPage() {
  const session = getCurrentAdmin();
  return (
    <>
      <header className="topbar">
        <div><h1>Access &amp; security</h1><div className="sub">Two-factor auth, roles &amp; account</div></div>
      </header>
      <div className="content">
        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <UsersManager self={session?.sub ?? ""} />
            <SecurityManager />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <h2>Signed in as</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="user-avatar" style={{ width: 40, height: 40 }}>{(session?.sub ?? "?").slice(0, 1).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{session?.sub}</div>
                  <div className="row-meta">{session ? ROLE_LABELS[session.role] : ""}</div>
                </div>
              </div>
            </div>
            <div className="card">
              <h2>Roles &amp; permissions</h2>
              <div className="table-wrap" style={{ border: "none" }}><table>
                <tbody>{ROLES.map((r) => (
                  <tr key={r.role}>
                    <td style={{ width: 110 }}><span className={`badge ${r.role === (session?.role) ? "published" : "neutral"}`}>{ROLE_LABELS[r.role]}</span></td>
                    <td style={{ fontSize: 12.5, color: "var(--a-muted)" }}>{r.can}</td>
                  </tr>
                ))}</tbody>
              </table></div>
              <p className="hint" style={{ marginTop: 10 }}>Create accounts and assign roles in Users &amp; permissions; the role model is enforced across every action.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
