import { NewsroomControls } from "@/components/admin/newsroom-controls";
import { getNewsroomLog } from "@/lib/admin/newsroom";
import { getSettings } from "@/lib/admin/settings";
import { getNewsroomStatus } from "@/lib/newsroom-status";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

const DECISION_BADGE: Record<string, string> = {
  published: "published", review: "review", duplicate: "neutral", skipped: "neutral", error: "review",
};

export default async function NewsroomPage() {
  const repo = process.env.GITHUB_REPO || "ilsportspulse/israeli-sports-desk";
  const [settings, log, status] = await Promise.all([
    getSettings(),
    getNewsroomLog(10),
    getNewsroomStatus().catch(() => null),
  ]);

  return (
    <>
      <header className="topbar">
        <div><h1>AI newsroom</h1><div className="sub">Autonomous cloud newsroom — controls & monitoring</div></div>
        <div className="spacer" />
        <a className="btn primary" href={`https://github.com/${repo}/actions/workflows/newsroom.yml`} target="_blank" rel="noreferrer">Run a cycle now ↗</a>
      </header>

      <div className="content">
        <div className="editor-grid">
          <div className="editor-main">
            <div className="card">
              <h2>Recent cycles</h2>
              {log.length === 0 ? (
                <div className="hint">No cycles logged yet. The cloud runs hourly; each cycle appears here with its decisions.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {log.map((cycle, i) => (
                    <div key={i} style={{ borderBottom: "1px solid var(--a-line)", paddingBottom: 12 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                        <b style={{ fontSize: 13 }}>{timeAgo(cycle.ts)}</b>
                        <span className="badge neutral">{cycle.mode}</span>
                        <span className="badge published">{cycle.published} published</span>
                        <span className="badge review">{cycle.review} review</span>
                        {cycle.skipped > 0 && <span className="badge neutral">{cycle.skipped} skipped</span>}
                        <span className="row-meta">gates ≥{cycle.gates?.confidenceMin} · autoPublish {cycle.gates?.autoPublish ? "on" : "off"}</span>
                      </div>
                      <div className="table-wrap" style={{ border: "none" }}>
                        <table>
                          <tbody>
                            {cycle.decisions.map((d, j) => (
                              <tr key={j}>
                                <td>{d.title || d.slug || d.url}
                                  {d.reason ? <div className="row-meta">{d.reason}</div> : null}</td>
                                <td style={{ width: 90, textAlign: "right" }}>
                                  {typeof d.confidence === "number" && <span className="row-meta">conf {d.confidence}</span>}
                                </td>
                                <td style={{ width: 90, textAlign: "right" }}>
                                  <span className={`badge ${DECISION_BADGE[d.decision] ?? "neutral"}`}>{d.decision}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="editor-side">
            <NewsroomControls initial={settings.newsroom} />
            <div className="card">
              <h2>Discovery status</h2>
              {status && status.checkedAt ? (
                <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--a-muted)" }}>
                  <div><b style={{ color: "var(--a-ink)" }}>{status.candidates}</b> candidates last scan</div>
                  <div>Feeds: <span className={`badge ${status.primaryFeedsHealthy ? "published" : "review"}`}>{status.primaryFeedsHealthy ? "healthy" : "check"}</span></div>
                  {status.errors > 0 && <div>{status.errors} errors</div>}
                  <div>Updated {timeAgo(status.checkedAt)}</div>
                </div>
              ) : <div className="hint">No discovery report yet.</div>}
            </div>
            <div className="card">
              <h2>How it works</h2>
              <p className="hint" style={{ lineHeight: 1.7 }}>
                A scheduled cloud job discovers Israeli-sport stories, drafts + fact-checks each against the gates above,
                and either holds them for your review or (if auto-publish is on) publishes them. It commits to git → the
                site redeploys automatically. Your Max subscription powers the drafting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
