"use client";

import { useState } from "react";

import type { ComplianceConfig } from "@/lib/admin/settings";

type Correction = { id: string; articleId: string; articleSlug: string; articleTitle: string; note: string; correctedAt: string; by: string };

export function ComplianceManager({ initial, initialCorrections }: { initial: ComplianceConfig; initialCorrections: Correction[] }) {
  const [c, setC] = useState<ComplianceConfig>(initial);
  const [corrections, setCorrections] = useState<Correction[]>(initialCorrections);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [newArticleId, setNewArticleId] = useState("");
  const [newNote, setNewNote] = useState("");

  const set = <K extends keyof ComplianceConfig>(k: K, v: ComplianceConfig[K]) => setC((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ compliance: c }) });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? { kind: "ok", text: "Compliance settings saved." } : { kind: "err", text: data.error || "Save failed." });
      if (res.ok) setC(data.settings.compliance);
    } finally { setBusy(false); }
  }

  async function addCorrection() {
    if (!newArticleId.trim() || !newNote.trim()) return;
    const res = await fetch("/api/admin/corrections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId: newArticleId.trim(), note: newNote.trim() }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg({ kind: "err", text: data.error || "Could not add correction." }); return; }
    setCorrections(data.corrections); setNewArticleId(""); setNewNote(""); setMsg({ kind: "ok", text: "Correction published." });
  }

  async function delCorrection(id: string) {
    const res = await fetch(`/api/admin/corrections?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setCorrections(data.corrections);
  }

  return (
    <>
      <header className="topbar">
        <div><h1>Compliance</h1><div className="sub">Founder anonymity · AI disclosure · corrections · consent</div></div>
        <div className="spacer" />
        <div className="save-bar">
          {msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
        </div>
      </header>

      <div className="content">
        <div className="grid cols-2" style={{ alignItems: "start", marginBottom: 16 }}>
          <div className="card">
            <h2>Founder anonymity guard</h2>
            <div className="field-row"><div className="field"><label>Enforce on publish</label>
              <select value={c.founderAnonymity ? "yes" : "no"} onChange={(e) => set("founderAnonymity", e.target.value === "yes")}>
                <option value="yes">Yes — block publish if a banned term appears</option><option value="no">Off</option></select></div></div>
            <div className="field-row"><div className="field"><label>Banned terms (one per line)</label>
              <textarea rows={5} value={c.bannedTerms.join("\n")} onChange={(e) => set("bannedTerms", e.target.value.split("\n").map((t) => t.trim()).filter(Boolean))}
                placeholder="Founder full name&#10;Founder handle" />
              <span className="hint">These must never appear on any public surface. Publishing is blocked if found.</span></div></div>
          </div>

          <div className="card">
            <h2>Disclosure & consent</h2>
            <div className="field-row"><div className="field"><label>Default AI disclosure</label>
              <textarea rows={3} value={c.aiDisclosureDefault} onChange={(e) => set("aiDisclosureDefault", e.target.value)} />
              <span className="hint">Applied to articles that don&rsquo;t set their own disclosure.</span></div></div>
            <div className="field-row two">
              <div className="field"><label>Cookie/consent notice</label>
                <select value={c.cookieConsent ? "yes" : "no"} onChange={(e) => set("cookieConsent", e.target.value === "yes")}>
                  <option value="no">Off (cookieless — not required)</option><option value="yes">Show notice</option></select></div>
            </div>
            <div className="field-row"><div className="field"><label>Consent text</label>
              <textarea rows={2} value={c.cookieConsentText} onChange={(e) => set("cookieConsentText", e.target.value)} /></div></div>
          </div>
        </div>

        <div className="card">
          <h2>Corrections log</h2>
          <div className="filters" style={{ marginBottom: 12 }}>
            <div className="field" style={{ minWidth: 220 }}><label>Article ID</label><input type="text" placeholder="live-20260720-…" value={newArticleId} onChange={(e) => setNewArticleId(e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>Correction note</label><input type="text" placeholder="What was corrected and when" value={newNote} onChange={(e) => setNewNote(e.target.value)} /></div>
            <div className="field"><label>&nbsp;</label><button className="btn primary" onClick={addCorrection}>Publish correction</button></div>
          </div>
          {corrections.length === 0 ? <div className="hint">No corrections issued.</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Article</th><th>Correction</th><th style={{ width: 110 }}>Date</th><th style={{ width: 70, textAlign: "right" }}></th></tr></thead>
              <tbody>{corrections.map((cor) => (
                <tr key={cor.id}>
                  <td><a className="row-title" href={`/admin/articles/${cor.articleId}`}>{cor.articleTitle}</a><div className="row-meta">/{cor.articleSlug}</div></td>
                  <td style={{ fontSize: 12.5 }}>{cor.note}</td>
                  <td style={{ color: "var(--a-muted)", fontSize: 12 }}>{new Date(cor.correctedAt).toLocaleDateString("en-GB")}</td>
                  <td style={{ textAlign: "right" }}><button className="btn sm danger" onClick={() => delCorrection(cor.id)}>×</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>
    </>
  );
}
