"use client";

import { useEffect, useMemo, useState } from "react";

import type { MediaAsset } from "@/lib/types";

type Entry = MediaAsset & { key: string };
type Msg = { kind: "ok" | "err"; text: string } | null;

// Article image manager, embedded in the article editor. The article's image is
// the media entry keyed by the article id — this card lets the editor upload a
// new photo, pick one from the media library, and edit attribution in place.
export function ArticleImageCard({ articleId }: { articleId: string }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [form, setForm] = useState<Partial<MediaAsset>>({});
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [justUploaded, setJustUploaded] = useState<string | null>(null);
  const [upAlt, setUpAlt] = useState("");
  const [upCredit, setUpCredit] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [library, setLibrary] = useState<Entry[]>([]);
  const [libSearch, setLibSearch] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/media/${encodeURIComponent(articleId)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({ media: null }));
    setEntry(data.media ?? null);
    setForm(data.media ?? {});
  }
  useEffect(() => { load(); }, [articleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof MediaAsset, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Local preview of the picked file, before it is uploaded.
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);

  async function upload() {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("key", articleId);
      fd.set("alt", upAlt.trim() || entry?.alt || "");
      fd.set("credit", upCredit.trim() || entry?.credit || "");
      if (entry) fd.set("replace", "1");
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: data.error || "Upload failed." }); return; }
      setMsg({
        kind: "ok",
        text: data.deferred
          ? "✅ Je nieuwe foto is opgeslagen en vervangt de oude — binnen ±1 minuut zichtbaar op de site. Hieronder zie je hem alvast."
          : "✅ Uploaded en direct actief.",
      });
      if (file) setJustUploaded(URL.createObjectURL(file));
      setFile(null); setUpAlt(""); setUpCredit("");
      load();
    } finally { setBusy(false); }
  }

  async function openPicker() {
    setPickerOpen(true);
    const res = await fetch("/api/admin/media", { cache: "no-store" });
    const data = await res.json().catch(() => ({ media: [] }));
    setLibrary(data.media ?? []);
  }

  async function pickFromLibrary(e: Entry) {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/media", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: articleId, fromKey: e.key, replace: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: data.error || "Failed." }); return; }
      setMsg({ kind: "ok", text: `Image assigned from "${e.key}".` });
      setPickerOpen(false);
      load();
    } finally { setBusy(false); }
  }

  async function saveAttribution() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/media/${encodeURIComponent(articleId)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: data.error || "Save failed." }); return; }
      setMsg({ kind: "ok", text: "Image details saved." });
      load();
    } finally { setBusy(false); }
  }

  async function removeImage() {
    if (!window.confirm("Remove this article's image?")) return;
    setBusy(true);
    await fetch(`/api/admin/media/${encodeURIComponent(articleId)}`, { method: "DELETE" });
    setBusy(false); setMsg({ kind: "ok", text: "Image removed." });
    load();
  }

  const filteredLib = library.filter((e) =>
    !libSearch.trim() || `${e.key} ${e.alt} ${e.credit}`.toLowerCase().includes(libSearch.toLowerCase()),
  ).slice(0, 24);

  return (
    <div className="card">
      <div className="section-head" style={{ justifyContent: "space-between" }}>
        <h2>Article image</h2>
        {msg && <span className={`msg ${msg.kind}`} style={{ fontSize: 12 }}>{msg.text}</span>}
      </div>

      {entry ? (
        <>
          {justUploaded ? (
            <div style={{ position: "relative", marginBottom: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- lokale preview van de zojuist geüploade foto */}
              <img src={justUploaded} alt="Zojuist geüpload"
                style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, background: "#eee", outline: "3px solid #16a34a" }} />
              <span style={{ position: "absolute", top: 8, left: 8, background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
                NIEUW — live binnen ±1 min
              </span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={entry.src} alt={entry.alt}
              style={{ width: "100%", height: 180, objectFit: "cover", objectPosition: entry.focalPoint ? `${entry.focalPoint.x}% ${entry.focalPoint.y}%` : "center", borderRadius: 8, marginBottom: 10, background: "#eee" }} />
          )}
          <div className="field-row two">
            <div className="field"><label>Alt text</label>
              <input type="text" value={form.alt ?? ""} onChange={(e) => set("alt", e.target.value)} /></div>
            <div className="field"><label>Credit</label>
              <input type="text" value={form.credit ?? ""} onChange={(e) => set("credit", e.target.value)} /></div>
          </div>
          <div className="field-row"><div className="field"><label>Caption</label>
            <input type="text" value={form.caption ?? ""} onChange={(e) => set("caption", e.target.value)} /></div></div>
          <div className="save-bar" style={{ marginBottom: 12 }}>
            <button className="btn primary" onClick={saveAttribution} disabled={busy}>Save image details</button>
            <button className="btn danger" onClick={removeImage} disabled={busy}>Remove image</button>
          </div>
        </>
      ) : (
        <p className="hint" style={{ marginBottom: 10 }}>No image yet — upload one, or pick from the media library.</p>
      )}

      {filePreview && (
        <div style={{ marginBottom: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={filePreview} alt="Preview of the file to upload"
            style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8, background: "#eee", border: "2px dashed var(--a-line, #ccc)" }} />
          <div className="hint" style={{ marginTop: 4 }}>Preview — not uploaded yet. {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : ""}</div>
        </div>
      )}
      <div className="field-row two">
        <div className="field"><label>{entry ? "Replace with new upload" : "Upload (JPEG/PNG/WebP/GIF, max 4 MB)"}</label>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        <div className="field"><label>Alt text {entry ? "(blank = keep current)" : "(required)"}</label>
          <input type="text" value={upAlt} onChange={(e) => setUpAlt(e.target.value)} placeholder={entry?.alt || "What the image shows"} /></div>
      </div>
      <div className="field-row"><div className="field"><label>Credit (blank = {entry?.credit ? "keep current" : "Israel Sports Pulse"})</label>
        <input type="text" value={upCredit} onChange={(e) => setUpCredit(e.target.value)} /></div></div>
      <div className="save-bar">
        <button className="btn primary" onClick={upload} disabled={busy || !file}>
          {busy ? "Working…" : entry ? "Replace image" : "Upload image"}
        </button>
        <button className="btn" onClick={openPicker} disabled={busy}>Choose from library…</button>
      </div>

      {pickerOpen && (
        <div style={{ marginTop: 12 }}>
          <div className="save-bar" style={{ marginBottom: 8 }}>
            <input type="text" placeholder="Search library…" value={libSearch} onChange={(e) => setLibSearch(e.target.value)} />
            <button className="btn" onClick={() => setPickerOpen(false)}>Close</button>
          </div>
          <div className="grid cols-3" style={{ gap: 8 }}>
            {filteredLib.map((e) => (
              <button key={e.key} className="card" onClick={() => pickFromLibrary(e)} style={{ padding: 4, cursor: "pointer", textAlign: "left" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.src} alt={e.alt} style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 5, background: "#eee" }} />
                <div className="row-meta" style={{ marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 11 }}>{e.key}</div>
              </button>
            ))}
          </div>
          {filteredLib.length === 0 && <p className="hint">No matches.</p>}
        </div>
      )}
      <p className="hint" style={{ marginTop: 8 }}>Only use photos you have the rights to. Attribution is kept with the image and shown on the article.</p>
    </div>
  );
}
