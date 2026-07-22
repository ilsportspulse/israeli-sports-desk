"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArticleImageCard } from "@/components/admin/article-image";
import type { Article } from "@/lib/types";

const KINDS = ["news", "analysis", "explainer"] as const;
const DESKS = ["israel", "international", "world"] as const;
const THEMES = [
  "night-pitch", "blue-court", "stadium-red", "transfer-grid",
  "golden-hour", "tactics-board", "track-lines", "press-box",
] as const;

type Props = { initial: Partial<Article>; mode: "edit" | "new" };

function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ArticleEditor({ initial, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Article>>({
    body: [""],
    facts: [],
    verificationSources: [],
    source: { name: "", url: "" },
    ...initial,
  });
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const status = (form.status ?? "published") as "published" | "review";
  const set = <K extends keyof Article>(key: K, value: Article[K]) => setForm((f) => ({ ...f, [key]: value }));

  // ---- array helpers ----
  const body = form.body ?? [""];
  const setBody = (i: number, v: string) => set("body", body.map((b, idx) => (idx === i ? v : b)));
  const addBody = () => set("body", [...body, ""]);
  const removeBody = (i: number) => set("body", body.filter((_, idx) => idx !== i));
  const moveBody = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= body.length) return;
    const next = [...body];
    [next[i], next[j]] = [next[j], next[i]];
    set("body", next);
  };

  const facts = form.facts ?? [];
  const setFact = (i: number, v: string) => set("facts", facts.map((f, idx) => (idx === i ? v : f)));

  const vs = form.verificationSources ?? [];
  const setVs = (i: number, key: "label" | "url", v: string) =>
    set("verificationSources", vs.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)));

  // ---- SEO ----
  const seo = form.seo ?? {};
  const setSeo = (k: keyof NonNullable<Article["seo"]>, v: unknown) => set("seo", { ...seo, [k]: v });
  const metaTitleLen = (seo.metaTitle || form.title || "").length;
  const metaDescLen = (seo.metaDescription || form.dek || "").length;
  const seoChecks = [
    { ok: metaTitleLen >= 15 && metaTitleLen <= 65, label: `Title length (${metaTitleLen}/65)` },
    { ok: metaDescLen >= 70 && metaDescLen <= 160, label: `Meta description (${metaDescLen}/160)` },
    { ok: (form.body ?? []).filter((b) => b.trim()).length >= 3, label: "At least 3 paragraphs" },
    { ok: Boolean(seo.focusKeyword && (form.title || "").toLowerCase().includes(seo.focusKeyword.toLowerCase())), label: "Focus keyword in title" },
    { ok: (form.verificationSources ?? []).length >= 2, label: "≥2 verification sources" },
  ];
  const seoScore = seoChecks.filter((c) => c.ok).length;

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const payload = { ...form, body: body.filter((b) => b.trim() !== ""), facts: facts.filter((f) => f.trim() !== "") };
      const res =
        mode === "new"
          ? await fetch("/api/admin/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          : await fetch(`/api/admin/articles/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error || "Save failed." });
        return;
      }
      if (mode === "new" && data.article?.id) {
        router.push(`/admin/articles/${data.article.id}`);
        return;
      }
      setForm((f) => ({ ...f, ...data.article }));
      setMsg({ kind: "ok", text: "Saved." });
      router.refresh();
    } catch {
      setMsg({ kind: "err", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function quickAction(action: "publish" | "reject") {
    if (mode === "new") return;
    setBusy(true);
    await fetch(`/api/admin/articles/${initial.id}/actions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    set("status", action === "publish" ? "published" : "review");
    setBusy(false);
    setMsg({ kind: "ok", text: action === "publish" ? "Published." : "Sent to review." });
    router.refresh();
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>{mode === "new" ? "New article" : "Edit article"}</h1>
          <div className="sub">{mode === "new" ? "Draft a new story" : `/${form.slug ?? ""}`}</div>
        </div>
        <div className="spacer" />
        <div className="save-bar">
          {msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
          {mode === "edit" && status === "published" && form.slug && (
            <a className="btn" href={`/stories/${form.slug}`} target="_blank" rel="noreferrer">View live ↗</a>
          )}
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </header>

      <div className="content">
        <div className="editor-grid">
          {/* ---- Main column ---- */}
          <div className="editor-main">
            <div className="card">
              <div className="field-row">
                <div className="field">
                  <label>Title</label>
                  <input type="text" value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Dek (standfirst)</label>
                  <textarea value={form.dek ?? ""} onChange={(e) => set("dek", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-head"><h2>Body</h2><span className="hint">{body.length} paragraph{body.length === 1 ? "" : "s"}</span></div>
              {body.map((para, i) => (
                <div key={i} className="block-item">
                  <span className="block-num">{i + 1}</span>
                  <textarea value={para} onChange={(e) => setBody(i, e.target.value)} rows={3} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button className="btn sm ghost" onClick={() => moveBody(i, -1)} disabled={i === 0} title="Move up">↑</button>
                    <button className="btn sm ghost" onClick={() => moveBody(i, 1)} disabled={i === body.length - 1} title="Move down">↓</button>
                    <button className="btn sm danger" onClick={() => removeBody(i)} disabled={body.length <= 1} title="Remove">×</button>
                  </div>
                </div>
              ))}
              <button className="btn sm" onClick={addBody}>+ Add paragraph</button>
            </div>

            {mode === "edit" && initial.id ? (
              <ArticleImageCard articleId={initial.id} />
            ) : (
              <div className="card">
                <div className="section-head"><h2>Article image</h2></div>
                <p className="hint">Save the article first — then you can upload or pick its image here.</p>
              </div>
            )}

            <div className="card">
              <div className="section-head"><h2>Key facts</h2></div>
              {facts.map((f, i) => (
                <div key={i} className="block-item">
                  <span className="block-num">•</span>
                  <textarea value={f} onChange={(e) => setFact(i, e.target.value)} rows={2} />
                  <button className="btn sm danger" onClick={() => set("facts", facts.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
              <button className="btn sm" onClick={() => set("facts", [...facts, ""])}>+ Add fact</button>
            </div>

            <div className="card">
              <div className="section-head"><h2>Source & verification</h2></div>
              <div className="field-row two">
                <div className="field"><label>Source name</label>
                  <input type="text" value={form.source?.name ?? ""} onChange={(e) => set("source", { ...(form.source ?? { name: "", url: "" }), name: e.target.value })} /></div>
                <div className="field"><label>Source URL</label>
                  <input type="text" value={form.source?.url ?? ""} onChange={(e) => set("source", { ...(form.source ?? { name: "", url: "" }), url: e.target.value })} /></div>
              </div>
              <label className="hint" style={{ display: "block", margin: "6px 0" }}>Verification sources</label>
              {vs.map((s, i) => (
                <div key={i} className="block-item">
                  <input type="text" placeholder="Label" value={s.label} onChange={(e) => setVs(i, "label", e.target.value)} style={{ maxWidth: 180 }} />
                  <input type="text" placeholder="https://…" value={s.url} onChange={(e) => setVs(i, "url", e.target.value)} />
                  <button className="btn sm danger" onClick={() => set("verificationSources", vs.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
              <button className="btn sm" onClick={() => set("verificationSources", [...vs, { label: "", url: "" }])}>+ Add source</button>
            </div>

            <div className="card">
              <div className="section-head" style={{ justifyContent: "space-between" }}>
                <h2>SEO</h2>
                <span className={`badge ${seoScore >= 4 ? "published" : seoScore >= 2 ? "review" : "neutral"}`}>Score {seoScore}/5</span>
              </div>
              <div className="field-row"><div className="field"><label>Meta title (override)</label>
                <input type="text" value={seo.metaTitle ?? ""} placeholder={form.title ?? ""} onChange={(e) => setSeo("metaTitle", e.target.value)} /></div></div>
              <div className="field-row"><div className="field"><label>Meta description (override)</label>
                <textarea value={seo.metaDescription ?? ""} placeholder={form.dek ?? ""} onChange={(e) => setSeo("metaDescription", e.target.value)} rows={2} /></div></div>
              <div className="field-row two">
                <div className="field"><label>Focus keyword</label>
                  <input type="text" value={seo.focusKeyword ?? ""} onChange={(e) => setSeo("focusKeyword", e.target.value)} /></div>
                <div className="field"><label>Keywords (comma-separated)</label>
                  <input type="text" value={(seo.keywords ?? []).join(", ")}
                    onChange={(e) => setSeo("keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean))} /></div>
              </div>
              <div className="field-row two">
                <div className="field"><label>Canonical URL (override)</label>
                  <input type="text" value={seo.canonical ?? ""} placeholder="auto" onChange={(e) => setSeo("canonical", e.target.value)} /></div>
                <div className="field"><label>OG image (override)</label>
                  <input type="text" value={seo.ogImage ?? ""} placeholder="auto" onChange={(e) => setSeo("ogImage", e.target.value)} /></div>
              </div>
              <div className="field-row"><div className="field"><label>Search visibility</label>
                <select value={seo.noindex ? "noindex" : "index"} onChange={(e) => setSeo("noindex", e.target.value === "noindex")}>
                  <option value="index">Index (visible in search)</option><option value="noindex">Noindex (hidden)</option></select></div></div>
              <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                {seoChecks.map((c, i) => (
                  <li key={i} style={{ fontSize: 12, color: c.ok ? "var(--a-green)" : "var(--a-muted)" }}>{c.ok ? "✓" : "○"} {c.label}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <div className="field-row">
                <div className="field"><label>AI disclosure</label>
                  <textarea value={form.aiDisclosure ?? ""} onChange={(e) => set("aiDisclosure", e.target.value)} rows={2} /></div>
              </div>
            </div>
          </div>

          {/* ---- Side column ---- */}
          <div className="editor-side">
            <div className="card">
              <h2>Publish</h2>
              <div className="field" style={{ marginBottom: 10 }}>
                <label>Status</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge ${status}`}>{status === "review" ? "In review" : "Published"}</span>
                  {mode === "edit" && (status === "review"
                    ? <button className="btn sm success" onClick={() => quickAction("publish")} disabled={busy}>Publish now</button>
                    : <button className="btn sm" onClick={() => quickAction("reject")} disabled={busy}>Send to review</button>)}
                </div>
              </div>
              <div className="field"><label>Published at</label>
                <input type="datetime-local" value={toLocalInput(form.publishedAt)}
                  onChange={(e) => set("publishedAt", e.target.value ? new Date(e.target.value).toISOString() : "")} /></div>
            </div>

            <div className="card">
              <h2>Classification</h2>
              <div className="field-row"><div className="field"><label>Slug</label>
                <input type="text" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
                <span className="hint">Changing this creates an automatic 301 redirect.</span></div></div>
              <div className="field-row"><div className="field"><label>Category</label>
                <input type="text" value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} /></div></div>
              <div className="field-row two">
                <div className="field"><label>Desk</label>
                  <select value={form.desk ?? "israel"} onChange={(e) => set("desk", e.target.value as Article["desk"])}>
                    {DESKS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
                <div className="field"><label>Kind</label>
                  <select value={form.kind ?? "news"} onChange={(e) => set("kind", e.target.value as Article["kind"])}>
                    {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
              </div>
              <div className="field-row"><div className="field"><label>Theme</label>
                <select value={form.theme ?? "night-pitch"} onChange={(e) => set("theme", e.target.value as Article["theme"])}>
                  {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div></div>
            </div>

            <div className="card">
              <h2>Homepage</h2>
              <div className="field-row two">
                <div className="field"><label>Read minutes</label>
                  <input type="number" value={form.readMinutes ?? 3} onChange={(e) => set("readMinutes", Number(e.target.value))} /></div>
                <div className="field"><label>Priority</label>
                  <input type="number" value={form.homepagePriority ?? 0} onChange={(e) => set("homepagePriority", Number(e.target.value))} /></div>
              </div>
              <div className="field-row two">
                <div className="field"><label>Trending</label>
                  <input type="number" value={form.trending ?? 0} onChange={(e) => set("trending", Number(e.target.value))} /></div>
                <div className="field"><label>Featured</label>
                  <select value={form.featured ? "yes" : "no"} onChange={(e) => set("featured", e.target.value === "yes")}>
                    <option value="no">No</option><option value="yes">Yes</option></select></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
