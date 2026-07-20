"use client";

import { useState } from "react";

import type { NewsroomGates } from "@/lib/admin/settings";

export function NewsroomControls({ initial }: { initial: NewsroomGates }) {
  const [g, setG] = useState<NewsroomGates>(initial);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof NewsroomGates>(k: K, v: NewsroomGates[K]) => setG((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newsroom: g }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: data.error || "Save failed." }); return; }
      setG(data.settings.newsroom);
      setMsg({ kind: "ok", text: "Gate settings saved — the next cloud cycle uses them." });
    } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="section-head" style={{ justifyContent: "space-between" }}>
        <h2>Automation & gates</h2>
        <span className={`badge ${g.enabled ? "published" : "review"}`}>{g.enabled ? "ON" : "OFF"}</span>
      </div>

      <div className="field-row two">
        <div className="field"><label>Automation</label>
          <select value={g.enabled ? "on" : "off"} onChange={(e) => set("enabled", e.target.value === "on")}>
            <option value="on">On — run every cycle</option><option value="off">Off — pause</option></select></div>
        <div className="field"><label>Auto-publish</label>
          <select value={g.autoPublish ? "yes" : "no"} onChange={(e) => set("autoPublish", e.target.value === "yes")}>
            <option value="no">No — hold in review</option><option value="yes">Yes — publish if gates pass</option></select>
          <span className="hint">Off = every story waits for your review.</span></div>
      </div>

      <div className="field-row two">
        <div className="field"><label>Confidence threshold ({g.confidenceThreshold.toFixed(2)})</label>
          <input type="number" step="0.01" min="0" max="1" value={g.confidenceThreshold}
            onChange={(e) => set("confidenceThreshold", Number(e.target.value))} /></div>
        <div className="field"><label>Namecheck threshold ({g.namecheckThreshold.toFixed(2)})</label>
          <input type="number" step="0.01" min="0" max="1" value={g.namecheckThreshold}
            onChange={(e) => set("namecheckThreshold", Number(e.target.value))} /></div>
      </div>

      <div className="field-row two">
        <div className="field"><label>Max candidates / cycle</label>
          <input type="number" min="1" max="20" value={g.maxCandidates}
            onChange={(e) => set("maxCandidates", Number(e.target.value))} /></div>
        <div className="field"><label>Require 2 full-time sources</label>
          <select value={g.requireTwoFtSources ? "yes" : "no"} onChange={(e) => set("requireTwoFtSources", e.target.value === "yes")}>
            <option value="yes">Yes</option><option value="no">No</option></select></div>
      </div>

      <div className="field-row">
        <div className="field"><label>Hold on any doubt</label>
          <select value={g.holdOnAnyDoubt ? "yes" : "no"} onChange={(e) => set("holdOnAnyDoubt", e.target.value === "yes")}>
            <option value="yes">Yes — conservative (recommended)</option><option value="no">No</option></select></div>
      </div>

      <div className="save-bar" style={{ marginTop: 6 }}>
        {msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
        <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save gates"}</button>
      </div>
    </div>
  );
}
