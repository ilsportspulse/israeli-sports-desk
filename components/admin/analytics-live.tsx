"use client";

import { useEffect, useState } from "react";

type Metric = { key: string; count: number };
type Live = { liveNow: number; livePaths: Metric[]; viewsToday: number; visitorsToday: number };

export function AnalyticsLive({ initial }: { initial: Live }) {
  const [live, setLive] = useState<Live>(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/admin/analytics/live", { cache: "no-store" });
        if (res.ok && alive) setLive(await res.json());
      } catch { /* ignore */ }
    };
    const id = setInterval(tick, 10000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="card">
      <div className="section-head" style={{ justifyContent: "space-between" }}>
        <h2>Who&rsquo;s on now</h2>
        <span className="badge published" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#1f9d63", display: "inline-block" }} />
          live
        </span>
      </div>
      <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
        <div className="stat"><div className="n">{live.liveNow}</div><div className="l">active now</div></div>
        <div className="stat"><div className="n">{live.visitorsToday}</div><div className="l">visitors today</div></div>
        <div className="stat"><div className="n">{live.viewsToday}</div><div className="l">views today</div></div>
      </div>
      {live.livePaths.length === 0 ? (
        <div className="hint">No active readers right now.</div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {live.livePaths.map((p) => (
            <li key={p.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.key}</span>
              <b>{p.count}</b>
            </li>
          ))}
        </ul>
      )}
      <p className="hint" style={{ marginTop: 10 }}>Updates every 10s · cookieless · IP-anonymised</p>
    </div>
  );
}
