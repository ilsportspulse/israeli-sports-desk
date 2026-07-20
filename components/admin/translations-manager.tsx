"use client";

import { useState } from "react";

import type { LocaleConfig, LocaleEntry } from "@/lib/admin/i18n";

export function TranslationsManager({ initial, coverage }: { initial: LocaleConfig; coverage: Record<string, number>; }) {
  const [cfg, setCfg] = useState<LocaleConfig>(initial);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save(patch: { defaultLocale?: string; statuses?: Record<string, LocaleEntry["status"]> }) {
    const res = await fetch("/api/admin/i18n", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setCfg(data.config); setMsg({ kind: "ok", text: "Saved." }); } else setMsg({ kind: "err", text: data.error || "Failed." });
  }

  return (
    <>
      <header className="topbar">
        <div><h1>Translations</h1><div className="sub">Locales, default language &amp; per-language coverage</div></div>
        <div className="spacer" />{msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
      </header>
      <div className="content">
        <div className="grid cols-2" style={{ alignItems: "start" }}>
          <div className="card">
            <h2>Languages</h2>
            <div className="field-row"><div className="field"><label>Default language</label>
              <select value={cfg.defaultLocale} onChange={(e) => save({ defaultLocale: e.target.value })}>
                {cfg.locales.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div></div>
            <div className="table-wrap" style={{ border: "none" }}><table>
              <thead><tr><th>Language</th><th style={{ width: 60 }}>Dir</th><th style={{ width: 130 }}>Status</th><th style={{ width: 90 }}>Articles</th></tr></thead>
              <tbody>{cfg.locales.map((l) => (
                <tr key={l.code}>
                  <td><b style={{ fontSize: 13 }}>{l.label}</b> <span className="row-meta">{l.nativeLabel} · {l.bcp47}</span></td>
                  <td><span className="badge neutral">{l.direction}</span></td>
                  <td><select value={l.status} onChange={(e) => save({ statuses: { [l.code]: e.target.value as LocaleEntry["status"] } })}>
                    <option value="active">Active</option><option value="prototype">Prototype</option><option value="planned">Planned</option></select></td>
                  <td>{coverage[l.code] ?? 0}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
          <div className="card">
            <h2>Translation workflow</h2>
            <p className="hint" style={{ lineHeight: 1.7 }}>
              English is the source language. Additional languages are drafted by the AI desk and reviewed before going
              <b> active</b>. Market names, categories and UI strings localise per language; each article links to its
              translations via hreflang. Set a language to <b>Active</b> to publish it, <b>Prototype</b> to preview it
              behind a path prefix, or <b>Planned</b> to hide it.
            </p>
            <p className="hint" style={{ marginTop: 10 }}>Auto-translate-on-publish (with a review gate) and per-locale sitemaps activate as more languages go live.</p>
          </div>
        </div>
      </div>
    </>
  );
}
