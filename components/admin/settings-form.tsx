"use client";

import { useState } from "react";

import type { Settings } from "@/lib/admin/settings";

type Redirect = { from: string; to: string; code: number; createdAt: string; reason?: string };

export function SettingsForm({ initial, initialRedirects }: { initial: Settings; initialRedirects: Redirect[] }) {
  const [s, setS] = useState<Settings>(initial);
  const [redirects, setRedirects] = useState<Redirect[]>(initialRedirects);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");

  const setBrand = (k: keyof Settings["branding"], v: string) => setS((p) => ({ ...p, branding: { ...p.branding, [k]: v } }));
  const setSeo = <K extends keyof Settings["seo"]>(k: K, v: Settings["seo"][K]) => setS((p) => ({ ...p, seo: { ...p.seo, [k]: v } }));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: data.error || "Save failed." }); return; }
      setS(data.settings);
      setMsg({ kind: "ok", text: "Settings saved." });
    } finally { setBusy(false); }
  }

  async function revalidate() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/revalidate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      setMsg(res.ok ? { kind: "ok", text: "Public cache purged." } : { kind: "err", text: "Revalidate failed." });
    } finally { setBusy(false); }
  }

  async function addRedirect() {
    if (!newFrom || !newTo) return;
    const res = await fetch("/api/admin/redirects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: newFrom, to: newTo, code: 301 }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setRedirects(data.redirects); setNewFrom(""); setNewTo(""); }
  }

  async function delRedirect(from: string) {
    const res = await fetch(`/api/admin/redirects?from=${encodeURIComponent(from)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setRedirects(data.redirects);
  }

  return (
    <>
      <header className="topbar">
        <div><h1>Settings</h1><div className="sub">Branding, SEO defaults, redirects & system</div></div>
        <div className="spacer" />
        <div className="save-bar">
          {msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
          <button className="btn" onClick={revalidate} disabled={busy}>Purge cache</button>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
        </div>
      </header>

      <div className="content">
        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div className="card">
            <h2>Branding</h2>
            <div className="field-row"><div className="field"><label>Site name</label>
              <input type="text" value={s.branding.siteName} onChange={(e) => setBrand("siteName", e.target.value)} /></div></div>
            <div className="field-row two">
              <div className="field"><label>Short name</label><input type="text" value={s.branding.shortName} onChange={(e) => setBrand("shortName", e.target.value)} /></div>
              <div className="field"><label>Favicon emoji</label><input type="text" value={s.branding.faviconEmoji} onChange={(e) => setBrand("faviconEmoji", e.target.value)} /></div>
            </div>
            <div className="field-row"><div className="field"><label>Tagline</label><input type="text" value={s.branding.tagline} onChange={(e) => setBrand("tagline", e.target.value)} /></div></div>
            <div className="field-row"><div className="field"><label>Description</label><textarea value={s.branding.description} onChange={(e) => setBrand("description", e.target.value)} /></div></div>
            <div className="field-row two">
              <div className="field"><label>Primary color</label><input type="text" value={s.branding.primaryColor} onChange={(e) => setBrand("primaryColor", e.target.value)} /></div>
              <div className="field"><label>Accent color</label><input type="text" value={s.branding.accentColor} onChange={(e) => setBrand("accentColor", e.target.value)} /></div>
            </div>
            <div className="field-row"><div className="field"><label>Logo URL</label><input type="text" value={s.branding.logoUrl} onChange={(e) => setBrand("logoUrl", e.target.value)} /></div></div>
          </div>

          <div className="card">
            <h2>SEO defaults</h2>
            <div className="field-row"><div className="field"><label>Title template</label>
              <input type="text" value={s.seo.titleTemplate} onChange={(e) => setSeo("titleTemplate", e.target.value)} /><span className="hint">Use %s for the page title.</span></div></div>
            <div className="field-row"><div className="field"><label>Default title</label><input type="text" value={s.seo.defaultTitle} onChange={(e) => setSeo("defaultTitle", e.target.value)} /></div></div>
            <div className="field-row"><div className="field"><label>Default description</label><textarea value={s.seo.defaultDescription} onChange={(e) => setSeo("defaultDescription", e.target.value)} /></div></div>
            <div className="field-row two">
              <div className="field"><label>Default OG image</label><input type="text" value={s.seo.defaultOgImage} onChange={(e) => setSeo("defaultOgImage", e.target.value)} /></div>
              <div className="field"><label>Twitter handle</label><input type="text" value={s.seo.twitterHandle} onChange={(e) => setSeo("twitterHandle", e.target.value)} /></div>
            </div>
            <div className="field-row two">
              <div className="field"><label>Canonical host</label><input type="text" value={s.seo.canonicalHost} onChange={(e) => setSeo("canonicalHost", e.target.value)} /></div>
              <div className="field"><label>Indexable</label>
                <select value={s.seo.indexable ? "yes" : "no"} onChange={(e) => setSeo("indexable", e.target.value === "yes")}>
                  <option value="yes">Yes (live)</option><option value="no">No (noindex)</option></select></div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2>Redirects manager</h2>
          <div className="filters" style={{ marginBottom: 12 }}>
            <div className="field" style={{ flex: 1 }}><label>From (path)</label><input type="text" placeholder="/old-path" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>To (path or URL)</label><input type="text" placeholder="/article/new-slug" value={newTo} onChange={(e) => setNewTo(e.target.value)} /></div>
            <div className="field"><label>&nbsp;</label><button className="btn primary" onClick={addRedirect}>Add 301</button></div>
          </div>
          {redirects.length === 0 ? <div className="hint">No redirects yet.</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>From</th><th>To</th><th style={{ width: 70 }}>Code</th><th style={{ width: 80, textAlign: "right" }}></th></tr></thead>
              <tbody>{redirects.map((r) => (
                <tr key={r.from}><td><code>{r.from}</code></td><td><code>{r.to}</code></td><td>{r.code}</td>
                  <td style={{ textAlign: "right" }}><button className="btn sm danger" onClick={() => delRedirect(r.from)}>Delete</button></td></tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>
    </>
  );
}
