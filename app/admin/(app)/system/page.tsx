import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

function mask(value: string | undefined): string {
  if (!value) return "— not set —";
  if (value.length <= 6) return "••••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

// Server component only — env values are masked and never sent raw to the browser.
export default function SystemPage() {
  const env = [
    { key: "GITHUB_REPO", value: process.env.GITHUB_REPO, secret: false },
    { key: "GITHUB_TOKEN", value: process.env.GITHUB_TOKEN, secret: true },
    { key: "CLAUDE_CODE_OAUTH_TOKEN", value: process.env.CLAUDE_CODE_OAUTH_TOKEN, secret: true },
    { key: "SOFASCORE_RAPIDAPI_KEY", value: process.env.SOFASCORE_RAPIDAPI_KEY, secret: true },
    { key: "ADMIN_SESSION_SECRET", value: process.env.ADMIN_SESSION_SECRET, secret: true },
    { key: "VERCEL", value: process.env.VERCEL, secret: false },
  ];
  const dns = [
    { host: siteConfig.primaryDomain, type: "A", target: "216.198.79.1 (Vercel)", note: "primary / canonical" },
    { host: `www.${siteConfig.primaryDomain}`, type: "CNAME", target: "cname.vercel-dns.com", note: "www" },
    { host: "ilsp.co.il", type: "301", target: siteConfig.primaryDomain, note: "short brand domain (redirect)" },
  ];

  return (
    <>
      <header className="topbar">
        <div><h1>System</h1><div className="sub">Deploy, integrations & backups</div></div>
      </header>
      <div className="content">
        <div className="grid cols-3" style={{ marginBottom: 16 }}>
          <div className="card stat"><div className="ic-badge" style={{ background: "#e4f4ec", color: "#157a4b" }}>▲</div>
            <div className="l">Hosting</div><div style={{ fontWeight: 700 }}>Vercel edge CDN</div></div>
          <div className="card stat"><div className="ic-badge" style={{ background: "#eaf0ff", color: "#1748c0" }}>⎇</div>
            <div className="l">Storage</div><div style={{ fontWeight: 700 }}>Git ({process.env.GITHUB_REPO ?? "repo"})</div></div>
          <div className="card stat"><div className="ic-badge" style={{ background: "#fdf1dc", color: "#9a6b04" }}>↺</div>
            <div className="l">Persistence mode</div><div style={{ fontWeight: 700 }}>{process.env.VERCEL ? "GitHub commit" : "Local disk (dev)"}</div></div>
        </div>

        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div className="card">
            <h2>Integrations & secrets (masked)</h2>
            <div className="table-wrap" style={{ border: "none" }}><table>
              <tbody>{env.map((e) => (
                <tr key={e.key}><td><code>{e.key}</code></td>
                  <td style={{ textAlign: "right" }}>
                    {e.value ? <span className="badge published">{e.secret ? mask(e.value) : e.value}</span> : <span className="badge review">not set</span>}
                  </td></tr>
              ))}</tbody>
            </table></div>
            <p className="hint" style={{ marginTop: 10 }}>Secrets are set as encrypted env vars in Vercel/GitHub — never stored in the repo or shown in full.</p>
          </div>

          <div className="card">
            <h2>DNS reference</h2>
            <div className="table-wrap" style={{ border: "none" }}><table>
              <thead><tr><th>Host</th><th>Type</th><th>Target</th></tr></thead>
              <tbody>{dns.map((d) => (
                <tr key={d.host}><td><code>{d.host}</code></td><td>{d.type}</td>
                  <td>{d.target}<div className="row-meta">{d.note}</div></td></tr>
              ))}</tbody>
            </table></div>
            <p className="hint" style={{ marginTop: 10 }}>Recommended: put Cloudflare in front (proxy) for WAF + DDoS protection.</p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2>Backups & resilience</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: "var(--a-muted)" }}>
            <li><b style={{ color: "var(--a-ink)" }}>Git history</b> — every content change is an immutable, timestamped version; one-click revert + redeploy.</li>
            <li><b style={{ color: "var(--a-ink)" }}>Edge CDN</b> — the last good deploy keeps serving even if a build fails or origin is down.</li>
            <li><b style={{ color: "var(--a-ink)" }}>Off-site mirror</b> — a second git remote is recommended so a GitHub incident is never data loss (Phase 12).</li>
            <li><b style={{ color: "var(--a-ink)" }}>Instant rollback</b> — any previous deployment can be promoted in the Vercel dashboard.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
