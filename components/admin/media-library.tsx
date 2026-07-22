"use client";

import { useEffect, useState } from "react";

import type { MediaAsset } from "@/lib/types";

type Entry = MediaAsset & { key: string };
type Issue = { key: string; severity: "error" | "warning"; message: string };
type CommonsResult = { title: string; pageUrl: string; fullUrl: string; thumbUrl: string; width: number; height: number; credit: string; license: string; licenseUrl: string };

export function MediaLibrary() {
  const [media, setMedia] = useState<Entry[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Entry | null>(null);
  const [form, setForm] = useState<Partial<MediaAsset>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [commonsQ, setCommonsQ] = useState("");
  const [commonsResults, setCommonsResults] = useState<CommonsResult[]>([]);
  const [commonsBusy, setCommonsBusy] = useState(false);
  const [upFile, setUpFile] = useState<File | null>(null);
  const [upKey, setUpKey] = useState("");
  const [upAlt, setUpAlt] = useState("");
  const [upCaption, setUpCaption] = useState("");
  const [upCredit, setUpCredit] = useState("");
  const [upBusy, setUpBusy] = useState(false);
  const [upMsg, setUpMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function load(q = "") {
    const res = await fetch(`/api/admin/media${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json().catch(() => ({ media: [], issues: [] }));
    setMedia(data.media ?? []);
    setIssues(data.issues ?? []);
  }
  useEffect(() => { load(); }, []);

  function pick(e: Entry) {
    setSelected(e);
    setForm({ ...e });
    setMsg(null);
    setCommonsResults([]);
  }

  const set = (k: keyof MediaAsset, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!selected) return;
    const res = await fetch(`/api/admin/media/${encodeURIComponent(selected.key)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg({ kind: "err", text: data.error || "Save failed." }); return; }
    setMsg({ kind: "ok", text: "Saved." });
    load(search);
  }

  async function searchCommons() {
    if (!commonsQ.trim()) return;
    setCommonsBusy(true);
    try {
      const res = await fetch(`/api/admin/media/commons?q=${encodeURIComponent(commonsQ)}`);
      const data = await res.json().catch(() => ({ results: [] }));
      setCommonsResults(data.results ?? []);
    } finally { setCommonsBusy(false); }
  }

  function applyCommons(r: CommonsResult) {
    setForm((f) => ({
      ...f,
      credit: `${r.credit} / Wikimedia Commons`,
      creditUrl: r.pageUrl,
      license: r.license,
      licenseUrl: r.licenseUrl,
      width: r.width,
      height: r.height,
    }));
    setMsg({ kind: "ok", text: `Attribution filled from Commons: ${r.title}. Review, then Save.` });
  }

  async function upload() {
    if (!upFile || !upKey.trim() || !upAlt.trim()) return;
    setUpBusy(true); setUpMsg(null);
    try {
      const fd = new FormData();
      fd.set("file", upFile);
      fd.set("key", upKey.trim());
      fd.set("alt", upAlt.trim());
      fd.set("caption", upCaption.trim());
      fd.set("credit", upCredit.trim());
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setUpMsg({ kind: "err", text: data.error || "Upload failed." }); return; }
      setUpMsg({
        kind: "ok",
        text: data.deferred
          ? "Uploaded. The image goes live with the deploy that just started (±1 min); the preview may 404 until then."
          : "Uploaded.",
      });
      setUpFile(null); setUpKey(""); setUpAlt(""); setUpCaption(""); setUpCredit("");
      load(search);
    } finally { setUpBusy(false); }
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;

  return (
    <>
      <header className="topbar">
        <div><h1>Media library</h1><div className="sub">{media.length} images · {errorCount} to fix</div></div>
        <div className="spacer" />
        <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="save-bar">
          <input type="text" className="search" placeholder="Search media…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn" type="submit">Search</button>
        </form>
      </header>

      <div className="content">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-head" style={{ justifyContent: "space-between" }}>
            <h2>Upload an image</h2>
            {upMsg && <span className={`msg ${upMsg.kind}`} style={{ fontSize: 12 }}>{upMsg.text}</span>}
          </div>
          <div className="field-row two">
            <div className="field"><label>Image file (JPEG/PNG/WebP/GIF, max 4 MB)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setUpFile(e.target.files?.[0] ?? null)} /></div>
            <div className="field"><label>Key (article id to attach, or a unique library name)</label>
              <input type="text" placeholder="e.g. maccabi-derby-preview" value={upKey} onChange={(e) => setUpKey(e.target.value)} /></div>
          </div>
          <div className="field-row two">
            <div className="field"><label>Alt text (required)</label>
              <input type="text" placeholder="What the image shows" value={upAlt} onChange={(e) => setUpAlt(e.target.value)} /></div>
            <div className="field"><label>Credit (default: Israel Sports Pulse)</label>
              <input type="text" placeholder="Photographer / source" value={upCredit} onChange={(e) => setUpCredit(e.target.value)} /></div>
          </div>
          <div className="field-row"><div className="field"><label>Caption (optional)</label>
            <input type="text" value={upCaption} onChange={(e) => setUpCaption(e.target.value)} /></div></div>
          <div className="save-bar">
            <button className="btn primary" onClick={upload} disabled={upBusy || !upFile || !upKey.trim() || !upAlt.trim()}>
              {upBusy ? "Uploading…" : "Upload"}
            </button>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>Only upload photos you have the rights to use. Uploads are stored in the site repository with full attribution.</p>
        </div>

        {issues.length > 0 && (
          <div className="card" style={{ marginBottom: 16, borderColor: errorCount ? "#f0c3c7" : "var(--a-line)" }}>
            <h2>Attribution & caption checks</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {issues.slice(0, 8).map((i, idx) => (
                <li key={idx} style={{ fontSize: 12.5 }}>
                  <span className={`badge ${i.severity === "error" ? "review" : "neutral"}`}>{i.severity}</span>{" "}
                  <b>{i.key}</b> — {i.message}
                </li>
              ))}
              {issues.length > 8 && <li className="hint">+ {issues.length - 8} more…</li>}
            </ul>
          </div>
        )}

        <div className="editor-grid">
          <div>
            <div className="grid cols-3">
              {media.map((e) => (
                <button key={e.key} className="card" onClick={() => pick(e)}
                  style={{ textAlign: "left", cursor: "pointer", padding: 0, overflow: "hidden", border: selected?.key === e.key ? "2px solid var(--a-blue)" : undefined }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.src} alt={e.alt} style={{ width: "100%", height: 120, objectFit: "cover", objectPosition: e.focalPoint ? `${e.focalPoint.x}% ${e.focalPoint.y}%` : "center", display: "block", background: "#eee" }} />
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.key}</div>
                    <div className="row-meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.credit}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="editor-side">
            {!selected ? (
              <div className="card"><div className="empty">Select an image to edit its attribution, caption and focal point.</div></div>
            ) : (
              <>
                <div className="card">
                  <div className="section-head" style={{ justifyContent: "space-between" }}><h2>Edit image</h2>
                    {msg && <span className={`msg ${msg.kind}`} style={{ fontSize: 12 }}>{msg.text}</span>}</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.src} alt={form.alt} style={{ width: "100%", height: 150, objectFit: "cover", objectPosition: form.focalPoint ? `${form.focalPoint.x}% ${form.focalPoint.y}%` : "center", borderRadius: 8, marginBottom: 12, background: "#eee" }} />
                  <div className="field-row"><div className="field"><label>Alt text</label>
                    <input type="text" value={form.alt ?? ""} onChange={(e) => set("alt", e.target.value)} /></div></div>
                  <div className="field-row"><div className="field"><label>Caption</label>
                    <textarea value={form.caption ?? ""} onChange={(e) => set("caption", e.target.value)} rows={2} /></div></div>
                  <div className="field-row two">
                    <div className="field"><label>Credit</label><input type="text" value={form.credit ?? ""} onChange={(e) => set("credit", e.target.value)} /></div>
                    <div className="field"><label>Licence</label><input type="text" value={form.license ?? ""} onChange={(e) => set("license", e.target.value)} /></div>
                  </div>
                  <div className="field-row"><div className="field"><label>Credit URL</label>
                    <input type="text" value={form.creditUrl ?? ""} onChange={(e) => set("creditUrl", e.target.value)} /></div></div>
                  <div className="field-row"><div className="field"><label>Licence URL</label>
                    <input type="text" value={form.licenseUrl ?? ""} onChange={(e) => set("licenseUrl", e.target.value)} /></div></div>
                  <div className="field-row two">
                    <div className="field"><label>Focal X (%)</label>
                      <input type="number" min="0" max="100" value={form.focalPoint?.x ?? 50}
                        onChange={(e) => set("focalPoint", { x: Number(e.target.value), y: form.focalPoint?.y ?? 50 })} /></div>
                    <div className="field"><label>Focal Y (%)</label>
                      <input type="number" min="0" max="100" value={form.focalPoint?.y ?? 50}
                        onChange={(e) => set("focalPoint", { x: form.focalPoint?.x ?? 50, y: Number(e.target.value) })} /></div>
                  </div>
                  <div className="save-bar"><button className="btn primary" onClick={save}>Save image</button></div>
                </div>

                <div className="card">
                  <h2>Find on Wikimedia Commons</h2>
                  <form onSubmit={(e) => { e.preventDefault(); searchCommons(); }} className="save-bar" style={{ marginBottom: 10 }}>
                    <input type="text" placeholder="e.g. Bloomfield Stadium" value={commonsQ} onChange={(e) => setCommonsQ(e.target.value)} />
                    <button className="btn" type="submit" disabled={commonsBusy}>{commonsBusy ? "…" : "Search"}</button>
                  </form>
                  <div className="grid cols-2" style={{ gap: 8 }}>
                    {commonsResults.map((r) => (
                      <button key={r.pageUrl} className="card" onClick={() => applyCommons(r)} style={{ padding: 6, cursor: "pointer", textAlign: "left" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.thumbUrl} alt={r.title} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 5 }} />
                        <div className="row-meta" style={{ marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.license || "—"}</div>
                      </button>
                    ))}
                  </div>
                  <p className="hint" style={{ marginTop: 8 }}>Clicking a result fills credit + licence + credit URL. It never claims to depict the event — keep the file-photo caption.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
