"use client";

import { useState } from "react";

import { COMMUNITY_MODULES, type CommunityConfig, type ModerationConfig, type ModuleKey } from "@/lib/admin/community-types";

export function CommunityManager({ initial }: { initial: CommunityConfig }) {
  const [cfg, setCfg] = useState<CommunityConfig>(initial);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save(patch: Partial<CommunityConfig>) {
    const res = await fetch("/api/admin/community", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setCfg(data.community); setMsg({ kind: "ok", text: "Saved." }); } else setMsg({ kind: "err", text: data.error || "Failed." });
  }
  const toggleModule = (k: ModuleKey) => save({ enabled: { ...cfg.enabled, [k]: !cfg.enabled[k] } });
  const setMod = <K extends keyof ModerationConfig>(k: K, v: ModerationConfig[K]) => save({ moderation: { ...cfg.moderation, [k]: v } });

  const anyEnabled = Object.values(cfg.enabled).some(Boolean);

  return (
    <>
      <header className="topbar">
        <div><h1>Community &amp; modules</h1><div className="sub">Feature modules · moderation · platform rails</div></div>
        <div className="spacer" />{msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
      </header>
      <div className="content">
        {anyEnabled && (
          <div className="card" style={{ marginBottom: 16, borderColor: "#e2c98a", background: "#fdf6e6" }}>
            <b style={{ fontSize: 13 }}>Heads up:</b> <span style={{ fontSize: 13 }}>user-generated content is live-toggled here, but the accounts/comments data layer needs a database (Vercel Postgres/KV) before it can actually run. Moderation below is non-negotiable the moment any UGC ships.</span>
          </div>
        )}
        <div className="editor-grid">
          <div className="editor-main">
            <div className="card">
              <h2>Feature modules</h2>
              <p className="hint" style={{ marginBottom: 12 }}>Every module plugs into the shared rails (identity, points/badges/leaderboards, realtime, notifications, moderation, data feeds).</p>
              <div className="grid cols-2" style={{ gap: 10 }}>
                {COMMUNITY_MODULES.map((m) => (
                  <div key={m.key} className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label} <span className="badge neutral" style={{ marginLeft: 4 }}>{m.phase}</span></div>
                      <div className="row-meta">{m.note}</div>
                    </div>
                    <button className={`btn sm ${cfg.enabled[m.key] ? "primary" : ""}`} onClick={() => toggleModule(m.key)}>{cfg.enabled[m.key] ? "On" : "Off"}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="editor-side">
            <div className="card">
              <h2>Moderation &amp; safety</h2>
              {([
                ["aiFilter", "AI auto-filter (hate/incitement/spam/doxxing)"],
                ["humanReviewQueue", "Human review queue"],
                ["requireEmailVerify", "Require email verification"],
                ["newAccountThrottle", "Throttle new accounts"],
                ["antiBrigade", "Anti-brigade / raid detection"],
              ] as [keyof ModerationConfig, string][]).map(([k, label]) => (
                <div key={k} className="field-row" style={{ marginBottom: 6 }}><div className="field" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5 }}>{label}</span>
                  <button className={`btn sm ${cfg.moderation[k] ? "primary" : ""}`} onClick={() => setMod(k, !cfg.moderation[k] as never)}>{cfg.moderation[k] ? "On" : "Off"}</button>
                </div></div>
              ))}
              <div className="field" style={{ marginTop: 8 }}><label>Moderation languages</label>
                <input type="text" value={cfg.moderation.languages.join(", ")} onChange={(e) => setCfg({ ...cfg, moderation: { ...cfg.moderation, languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })}
                  onBlur={() => setMod("languages", cfg.moderation.languages)} /></div>
              <div className="field" style={{ marginTop: 8 }}><label>Banned words (comma-separated)</label>
                <textarea rows={3} value={cfg.moderation.bannedWords.join(", ")} onChange={(e) => setCfg({ ...cfg, moderation: { ...cfg.moderation, bannedWords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })}
                  onBlur={() => setMod("bannedWords", cfg.moderation.bannedWords)} /></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
