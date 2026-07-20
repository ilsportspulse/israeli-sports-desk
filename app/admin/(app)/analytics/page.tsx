import { AnalyticsLive } from "@/components/admin/analytics-live";
import { getAnalyticsSummary, type Metric } from "@/lib/analytics/aggregate";

export const dynamic = "force-dynamic";

function BarList({ items, max }: { items: Metric[]; max?: number }) {
  const top = (max ? items.slice(0, max) : items);
  const peak = Math.max(1, ...top.map((i) => i.count));
  if (top.length === 0) return <div className="hint">No data yet.</div>;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      {top.map((i) => (
        <li key={i.key}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "78%" }}>{i.label || i.key}</span>
            <b>{i.count}</b>
          </div>
          <div style={{ height: 6, background: "#eef0ec", borderRadius: 999 }}>
            <div style={{ width: `${(i.count / peak) * 100}%`, height: 6, background: "var(--a-blue)", borderRadius: 999 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage() {
  const s = await getAnalyticsSummary(14);
  const peakDay = Math.max(1, ...s.perDay.map((d) => d.count));

  const cards = [
    { n: s.totalViews, l: `Views (${s.windowDays}d)`, bg: "#eaf0ff", fg: "#1748c0", ic: "▤" },
    { n: s.uniqueVisitors, l: "Unique visitors", bg: "#e4f4ec", fg: "#157a4b", ic: "◕" },
    { n: s.viewsToday, l: "Views today", bg: "#fdf1dc", fg: "#9a6b04", ic: "☀" },
    { n: s.botViews, l: "Bot views (excluded)", bg: "#eef0ec", fg: "#5c6472", ic: "⛨" },
  ];

  return (
    <>
      <header className="topbar">
        <div><h1>Analytics</h1><div className="sub">Self-hosted · privacy-first · cookieless — last {s.windowDays} days</div></div>
      </header>

      <div className="content">
        <div className="grid cols-4" style={{ marginBottom: 16 }}>
          {cards.map((c) => (
            <div key={c.l} className="card stat">
              <div className="ic-badge" style={{ background: c.bg, color: c.fg }}>{c.ic}</div>
              <div className="n">{c.n}</div><div className="l">{c.l}</div>
            </div>
          ))}
        </div>

        <div className="grid cols-2" style={{ gridTemplateColumns: "1.5fr 1fr", alignItems: "start", marginBottom: 16 }}>
          <div className="card">
            <h2>Views per day</h2>
            {s.perDay.length === 0 ? <div className="hint">No views recorded yet. The beacon logs page views on the public site.</div> : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, marginTop: 8 }}>
                {s.perDay.map((d) => (
                  <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", height: `${(d.count / peakDay) * 110}px`, minHeight: 2, background: "var(--a-blue)", borderRadius: "4px 4px 0 0" }} title={`${d.count}`} />
                    <span style={{ fontSize: 9.5, color: "var(--a-muted)" }}>{d.key.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <AnalyticsLive initial={{ liveNow: s.liveNow, livePaths: s.livePaths, viewsToday: s.viewsToday, visitorsToday: s.visitorsToday }} />
        </div>

        <div className="grid cols-2" style={{ alignItems: "start", marginBottom: 16 }}>
          <div className="card"><h2>Top articles</h2><BarList items={s.topArticles} max={10} /></div>
          <div className="card"><h2>Top pages</h2><BarList items={s.topPages} max={10} /></div>
        </div>

        <div className="grid cols-3" style={{ alignItems: "start", marginBottom: 16 }}>
          <div className="card"><h2>Where they come from</h2><BarList items={s.referrerTypes} /></div>
          <div className="card"><h2>Top referrers</h2><BarList items={s.topReferrers} max={8} /></div>
          <div className="card"><h2>Countries</h2><BarList items={s.countries} max={8} /></div>
        </div>

        <div className="grid cols-3" style={{ alignItems: "start" }}>
          <div className="card"><h2>Devices</h2><BarList items={s.devices} /></div>
          <div className="card"><h2>Browsers</h2><BarList items={s.browsers} /></div>
          <div className="card"><h2>Operating systems</h2><BarList items={s.os} /></div>
        </div>

        {s.campaigns.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}><h2>UTM campaigns</h2><BarList items={s.campaigns} max={10} /></div>
        )}
      </div>
    </>
  );
}
