import { getAuditLog } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export default async function AuditPage() {
  const entries = await getAuditLog(300);

  return (
    <>
      <header className="topbar">
        <div><h1>Audit log</h1><div className="sub">Every create, edit, publish, delete & sign-in — {entries.length} entries</div></div>
      </header>
      <div className="content">
        <div className="table-wrap">
          <table>
            <thead><tr><th style={{ width: 130 }}>When</th><th style={{ width: 120 }}>Who</th><th style={{ width: 150 }}>Action</th><th>Summary</th></tr></thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={4}><div className="empty">No activity logged yet.</div></td></tr>
              ) : entries.map((e, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--a-muted)", fontSize: 12 }} title={e.ts}>{timeAgo(e.ts)}</td>
                  <td><b style={{ fontSize: 12.5 }}>{e.actor}</b></td>
                  <td><span className="badge neutral" style={{ fontFamily: "monospace", fontSize: 11 }}>{e.action}</span></td>
                  <td style={{ fontSize: 12.5 }}>{e.summary || "—"}{e.target ? <span className="row-meta"> · {e.target}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
