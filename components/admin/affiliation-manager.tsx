"use client";

import { useState } from "react";

import type { AdSlot, AffiliateLink, AffiliationConfig } from "@/lib/admin/affiliation";

export function AffiliationManager({ initial }: { initial: AffiliationConfig }) {
  const [cfg, setCfg] = useState<AffiliationConfig>(initial);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const setLink = (i: number, k: keyof AffiliateLink, v: unknown) =>
    setCfg((c) => ({ ...c, links: c.links.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)) }));
  const addLink = () => setCfg((c) => ({ ...c, links: [...c.links, { id: `aff-${Date.now().toString(36)}`, name: "", partner: "", url: "", trackingParam: "utm_source=ilsp", disclosure: "Affiliate link", category: "general", active: true }] }));
  const setSlot = (i: number, k: keyof AdSlot, v: unknown) =>
    setCfg((c) => ({ ...c, adSlots: c.adSlots.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)) }));
  const addSlot = () => setCfg((c) => ({ ...c, adSlots: [...c.adSlots, { id: `ad-${Date.now().toString(36)}`, name: "", placement: "sidebar", code: "", active: true }] }));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/affiliation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? { kind: "ok", text: "Saved." } : { kind: "err", text: data.error || "Failed." });
      if (res.ok) setCfg(data.affiliation);
    } finally { setBusy(false); }
  }

  return (
    <>
      <header className="topbar">
        <div><h1>Monetisation</h1><div className="sub">Affiliate links · ad slots · betting compliance</div></div>
        <div className="spacer" />
        <div className="save-bar">{msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
      </header>
      <div className="content">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-head" style={{ justifyContent: "space-between" }}><h2>Affiliate links</h2><button className="btn sm" onClick={addLink}>+ Add link</button></div>
          {cfg.links.length === 0 ? <div className="hint">No affiliate links yet.</div> : (
            <div className="table-wrap" style={{ border: "none" }}><table>
              <thead><tr><th>Name</th><th>Partner</th><th>URL</th><th style={{ width: 110 }}>Type</th><th style={{ width: 70 }}>Active</th><th style={{ width: 40 }}></th></tr></thead>
              <tbody>{cfg.links.map((l, i) => (
                <tr key={l.id}>
                  <td><input type="text" value={l.name} onChange={(e) => setLink(i, "name", e.target.value)} /></td>
                  <td><input type="text" value={l.partner} onChange={(e) => setLink(i, "partner", e.target.value)} /></td>
                  <td><input type="text" value={l.url} onChange={(e) => setLink(i, "url", e.target.value)} /></td>
                  <td><select value={l.category} onChange={(e) => setLink(i, "category", e.target.value)}><option value="general">General</option><option value="betting">Betting</option></select></td>
                  <td><select value={l.active ? "y" : "n"} onChange={(e) => setLink(i, "active", e.target.value === "y")}><option value="y">On</option><option value="n">Off</option></select></td>
                  <td><button className="btn sm danger" onClick={() => setCfg((c) => ({ ...c, links: c.links.filter((_, idx) => idx !== i) }))}>×</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-head" style={{ justifyContent: "space-between" }}><h2>Ad slots</h2><button className="btn sm" onClick={addSlot}>+ Add slot</button></div>
          {cfg.adSlots.length === 0 ? <div className="hint">No ad slots yet. Sponsored content must always carry a disclosure label.</div> : (
            cfg.adSlots.map((s, i) => (
              <div key={s.id} className="field-row two" style={{ marginBottom: 10 }}>
                <div className="field"><label>Name</label><input type="text" value={s.name} onChange={(e) => setSlot(i, "name", e.target.value)} /></div>
                <div className="field"><label>Placement</label>
                  <select value={s.placement} onChange={(e) => setSlot(i, "placement", e.target.value)}>
                    <option value="homepage-lead">Homepage lead</option><option value="article-top">Article top</option><option value="article-bottom">Article bottom</option><option value="sidebar">Sidebar</option></select></div>
                <div className="field" style={{ gridColumn: "1 / -1" }}><label>Code (house ad HTML / network snippet)</label><textarea rows={2} value={s.code} onChange={(e) => setSlot(i, "code", e.target.value)} /></div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
                  <select value={s.active ? "y" : "n"} onChange={(e) => setSlot(i, "active", e.target.value === "y")} style={{ maxWidth: 100 }}><option value="y">Active</option><option value="n">Off</option></select>
                  <button className="btn sm danger" onClick={() => setCfg((c) => ({ ...c, adSlots: c.adSlots.filter((_, idx) => idx !== i) }))}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h2>Betting / odds compliance</h2>
          <div className="field-row two">
            <div className="field"><label>Betting affiliate compliance</label>
              <select value={cfg.betting.enabled ? "y" : "n"} onChange={(e) => setCfg((c) => ({ ...c, betting: { ...c.betting, enabled: e.target.value === "y" } }))}><option value="n">Off</option><option value="y">On (age-gate + notices)</option></select></div>
            <div className="field"><label>Minimum age</label><input type="number" value={cfg.betting.minAge} onChange={(e) => setCfg((c) => ({ ...c, betting: { ...c.betting, minAge: Number(e.target.value) } }))} /></div>
          </div>
          <div className="field-row"><div className="field"><label>Geo restriction (allowed regions, comma-separated; blank = all)</label>
            <input type="text" value={cfg.betting.geoRestrict} onChange={(e) => setCfg((c) => ({ ...c, betting: { ...c.betting, geoRestrict: e.target.value } }))} placeholder="IL, EU" /></div></div>
          <div className="field-row"><div className="field"><label>Responsible-gambling notice</label>
            <textarea rows={2} value={cfg.betting.responsibleGamblingNotice} onChange={(e) => setCfg((c) => ({ ...c, betting: { ...c.betting, responsibleGamblingNotice: e.target.value } }))} /></div></div>
        </div>
      </div>
    </>
  );
}
