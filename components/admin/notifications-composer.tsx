"use client";

import { useState } from "react";

import type { NotifConfig, Notification } from "@/lib/admin/notifications-types";

export function NotificationsComposer({ initialConfig, initialQueue, fcmReady }: { initialConfig: NotifConfig; initialQueue: Notification[]; fcmReady: boolean }) {
  const [config, setConfig] = useState<NotifConfig>(initialConfig);
  const [queue, setQueue] = useState<Notification[]>(initialQueue);
  const [form, setForm] = useState({ title: "", body: "", deepLink: "", segment: "all", platform: "all", scheduledAt: "" });
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const saveConfig = async (patch: Partial<NotifConfig>) => {
    const next = { ...config, ...patch }; setConfig(next);
    await fetch("/api/admin/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
  };

  async function compose(send: boolean) {
    if (!form.title.trim() || !form.body.trim()) { setMsg({ kind: "err", text: "Title and body required." }); return; }
    const res = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: form.scheduledAt ? "scheduled" : "draft" }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg({ kind: "err", text: data.error || "Failed." }); return; }
    setQueue(data.queue);
    if (send && !form.scheduledAt) await sendNow(data.notification.id);
    setForm({ title: "", body: "", deepLink: "", segment: "all", platform: "all", scheduledAt: "" });
    setMsg({ kind: "ok", text: send && !form.scheduledAt ? "Sent." : form.scheduledAt ? "Scheduled." : "Saved as draft." });
  }
  async function sendNow(id: string) { const r = await fetch(`/api/admin/notifications/${id}`, { method: "POST" }); const d = await r.json().catch(() => ({})); if (r.ok) setQueue(d.queue); }
  async function del(id: string) { const r = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" }); const d = await r.json().catch(() => ({})); if (r.ok) setQueue(d.queue); }

  return (
    <>
      <header className="topbar">
        <div><h1>Apps &amp; notifications</h1><div className="sub">Push composer · segments · feature flags {fcmReady ? "" : "· connect FCM to deliver"}</div></div>
      </header>
      <div className="content">
        <div className="editor-grid">
          <div className="editor-main">
            <div className="card">
              <h2>Compose push</h2>
              <div className="field-row"><div className="field"><label>Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={60} /></div></div>
              <div className="field-row"><div className="field"><label>Body</label><textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={160} /></div></div>
              <div className="field-row two">
                <div className="field"><label>Deep link</label><input type="text" value={form.deepLink} onChange={(e) => setForm({ ...form, deepLink: e.target.value })} placeholder="/article/…" /></div>
                <div className="field"><label>Segment</label><select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>{config.segments.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
              </div>
              <div className="field-row two">
                <div className="field"><label>Platform</label><select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}><option value="all">iOS + Android</option><option value="ios">iOS</option><option value="android">Android</option></select></div>
                <div className="field"><label>Schedule (optional)</label><input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
              </div>
              <div className="save-bar">{msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
                <button className="btn" onClick={() => compose(false)}>Save draft</button>
                <button className="btn primary" onClick={() => compose(true)}>{form.scheduledAt ? "Schedule" : "Send now"}</button></div>
            </div>

            <div className="card">
              <h2>Sent &amp; scheduled</h2>
              {queue.length === 0 ? <div className="hint">No notifications yet.</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{queue.map((n) => (
                  <div key={n.id} style={{ borderBottom: "1px solid var(--a-line)", paddingBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                      <span className={`badge ${n.status === "sent" ? "published" : n.status === "failed" ? "review" : "neutral"}`}>{n.status}</span>
                      <span className="badge desk">{n.segment}</span><span className="badge neutral">{n.platform}</span>
                      <b style={{ fontSize: 13 }}>{n.title}</b>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--a-muted)" }}>{n.body}{n.result ? ` · ${n.result}` : ""}</div>
                    <div className="row-actions" style={{ justifyContent: "flex-start", marginTop: 5 }}>
                      {n.status !== "sent" && <button className="btn sm success" onClick={() => sendNow(n.id)}>Send now</button>}
                      <button className="btn sm danger" onClick={() => del(n.id)}>Delete</button>
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>

          <div className="editor-side">
            <div className="card">
              <h2>App feature flags</h2>
              {Object.entries(config.featureFlags).map(([k, v]) => (
                <div key={k} className="field-row" style={{ marginBottom: 6 }}><div className="field" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13 }}>{k}</span>
                  <button className={`btn sm ${v ? "primary" : ""}`} onClick={() => saveConfig({ featureFlags: { ...config.featureFlags, [k]: !v } })}>{v ? "On" : "Off"}</button>
                </div></div>
              ))}
              <div className="field" style={{ marginTop: 8 }}><label>Minimum app version</label><input type="text" value={config.minAppVersion} onChange={(e) => setConfig({ ...config, minAppVersion: e.target.value })} onBlur={() => saveConfig({ minAppVersion: config.minAppVersion })} /></div>
            </div>
            <div className="card">
              <h2>Kill switches</h2>
              {(["scores", "notifications", "community"] as const).map((k) => (
                <div key={k} className="field-row" style={{ marginBottom: 6 }}><div className="field" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13 }}>Disable {k}</span>
                  <button className={`btn sm ${config.killSwitches[k] ? "danger" : ""}`} onClick={() => saveConfig({ killSwitches: { ...config.killSwitches, [k]: !config.killSwitches[k] } })}>{config.killSwitches[k] ? "Killed" : "Live"}</button>
                </div></div>
              ))}
              <p className="hint" style={{ marginTop: 8 }}>Emergency switches the apps read to disable a feature instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
