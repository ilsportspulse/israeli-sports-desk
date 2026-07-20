"use client";

import { useState } from "react";

import type { CategoryConfig, NavItem, TaxonomyConfig } from "@/lib/admin/taxonomy";

const DESKS = ["", "israel", "international", "world"];

export function TaxonomyEditor({ initial }: { initial: TaxonomyConfig }) {
  const [cats, setCats] = useState<CategoryConfig[]>(initial.categories);
  const [nav, setNav] = useState<NavItem[]>(initial.nav);
  const [featured, setFeatured] = useState<string>(initial.featuredSlugs.join("\n"));
  const [newCat, setNewCat] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function addCategory() {
    const name = newCat.trim();
    if (!name || cats.some((c) => c.name.toLowerCase() === name.toLowerCase())) { setNewCat(""); return; }
    setCats([...cats, { name, order: cats.length, importance: 2 }]);
    setNewCat("");
  }

  function moveCat(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const next = [...cats];
    [next[i], next[j]] = [next[j], next[i]];
    setCats(next.map((c, idx) => ({ ...c, order: idx })));
  }
  const setCat = (i: number, k: keyof CategoryConfig, v: unknown) =>
    setCats(cats.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));

  function moveNav(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= nav.length) return;
    const next = [...nav];
    [next[i], next[j]] = [next[j], next[i]];
    setNav(next.map((n, idx) => ({ ...n, order: idx })));
  }
  const setNavItem = (i: number, k: keyof NavItem, v: unknown) =>
    setNav(nav.map((n, idx) => (idx === i ? { ...n, [k]: v } : n)));

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const body: Partial<TaxonomyConfig> = {
        categories: cats.map((c, idx) => ({ ...c, order: idx })),
        nav: nav.map((n, idx) => ({ ...n, order: idx })),
        featuredSlugs: featured.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch("/api/admin/taxonomy", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: data.error || "Save failed." }); return; }
      setMsg({ kind: "ok", text: "Saved — the public site will use this order." });
    } finally { setBusy(false); }
  }

  return (
    <>
      <header className="topbar">
        <div><h1>Taxonomy & navigation</h1><div className="sub">Category order, menu & featured slots</div></div>
        <div className="spacer" />
        <div className="save-bar">
          {msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </header>

      <div className="content">
        <div className="editor-grid">
          <div className="editor-main">
            <div className="card">
              <div className="section-head" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}><h2>Categories</h2><span className="hint">{cats.length} · order = public tab order</span></div>
                <form onSubmit={(e) => { e.preventDefault(); addCategory(); }} style={{ display: "flex", gap: 6 }}>
                  <input type="text" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category…" style={{ maxWidth: 170 }} />
                  <button className="btn sm primary" type="submit">+ Add</button>
                </form>
              </div>
              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <thead><tr><th style={{ width: 60 }}>Order</th><th>Category</th><th style={{ width: 130 }}>Desk</th><th style={{ width: 110 }}>Importance</th><th style={{ width: 80 }}>Visible</th></tr></thead>
                  <tbody>
                    {cats.map((c, i) => (
                      <tr key={c.name}>
                        <td>
                          <button className="btn sm ghost" onClick={() => moveCat(i, -1)} disabled={i === 0}>↑</button>
                          <button className="btn sm ghost" onClick={() => moveCat(i, 1)} disabled={i === cats.length - 1}>↓</button>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 12.5 }}>{c.name}</div>
                          <input type="text" placeholder="Display label (optional)" value={c.label ?? ""} onChange={(e) => setCat(i, "label", e.target.value)} style={{ marginTop: 4 }} />
                        </td>
                        <td>
                          <select value={c.desk ?? ""} onChange={(e) => setCat(i, "desk", e.target.value)}>
                            {DESKS.map((d) => <option key={d} value={d}>{d || "—"}</option>)}
                          </select>
                        </td>
                        <td>
                          <select value={c.importance ?? 2} onChange={(e) => setCat(i, "importance", Number(e.target.value))}>
                            <option value={3}>High</option><option value={2}>Normal</option><option value={1}>Low</option>
                          </select>
                        </td>
                        <td>
                          <select value={c.hidden ? "no" : "yes"} onChange={(e) => setCat(i, "hidden", e.target.value === "no")}>
                            <option value="yes">Shown</option><option value="no">Hidden</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="editor-side">
            <div className="card">
              <div className="section-head" style={{ justifyContent: "space-between" }}><h2>Navigation menu</h2>
                <button className="btn sm" onClick={() => setNav([...nav, { label: "New", href: "/", order: nav.length }])}>+ Add</button></div>
              {nav.map((n, i) => (
                <div key={i} className="block-item" style={{ alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <button className="btn sm ghost" onClick={() => moveNav(i, -1)} disabled={i === 0}>↑</button>
                    <button className="btn sm ghost" onClick={() => moveNav(i, 1)} disabled={i === nav.length - 1}>↓</button>
                  </div>
                  <input type="text" value={n.label} onChange={(e) => setNavItem(i, "label", e.target.value)} style={{ maxWidth: 110 }} />
                  <input type="text" value={n.href} onChange={(e) => setNavItem(i, "href", e.target.value)} />
                  <button className="btn sm danger" onClick={() => setNav(nav.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>Homepage featured pins</h2>
              <div className="field"><label>Article slugs (one per line)</label>
                <textarea value={featured} onChange={(e) => setFeatured(e.target.value)} rows={4} placeholder="pinned-story-slug" /></div>
              <p className="hint" style={{ marginTop: 8 }}>Pinned stories get top priority in the homepage lead pool.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
