"use client";

import { useState } from "react";

import { PLATFORMS, type Platform, type SocialConfig, type SocialPost } from "@/lib/admin/social-types";

export function SocialHub({ initialConfig, initialPosts, telegramReady }: { initialConfig: SocialConfig; initialPosts: SocialPost[]; telegramReady: boolean }) {
  const [config, setConfig] = useState<SocialConfig>(initialConfig);
  const [posts, setPosts] = useState<SocialPost[]>(initialPosts);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const enabledPlatforms = PLATFORMS.filter((p) => config.enabled[p.key]);

  async function saveConfig(patch: Partial<SocialConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);
    await fetch("/api/admin/social", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
  }
  const toggleEnabled = (k: Platform) => saveConfig({ enabled: { ...config.enabled, [k]: !config.enabled[k] } });
  const togglePlatform = (k: Platform) => setPlatforms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  async function compose(post = true) {
    if (!text.trim() || platforms.length === 0) { setMsg({ kind: "err", text: "Add text and pick a platform." }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/social", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, link, hashtags, platforms, scheduledAt: scheduledAt || undefined, status: scheduledAt ? "scheduled" : "draft" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: data.error || "Failed." }); return; }
      setPosts(data.posts);
      const created: SocialPost = data.post;
      setText(""); setLink(""); setHashtags(""); setPlatforms([]); setScheduledAt("");
      if (post && !scheduledAt) { await postNow(created.id); setMsg({ kind: "ok", text: "Posted." }); }
      else setMsg({ kind: "ok", text: scheduledAt ? "Scheduled." : "Saved as draft." });
    } finally { setBusy(false); }
  }

  async function postNow(id: string) {
    const res = await fetch(`/api/admin/social/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "post-now" }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPosts(data.posts);
  }
  async function del(id: string) {
    const res = await fetch(`/api/admin/social/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPosts(data.posts);
  }

  return (
    <>
      <header className="topbar">
        <div><h1>Social hub</h1><div className="sub">Compose once · publish to every network</div></div>
      </header>
      <div className="content">
        <div className="editor-grid">
          <div className="editor-main">
            <div className="card">
              <h2>Compose</h2>
              <div className="field-row"><div className="field"><label>Post text</label>
                <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What's happening in Israeli sport…" />
                <span className="hint">{text.length} chars · hashtags {config.defaultHashtags} appended automatically</span></div></div>
              <div className="field-row two">
                <div className="field"><label>Link (article path or URL)</label>
                  <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/article/…" /></div>
                <div className="field"><label>Hashtags (this post)</label>
                  <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder={config.defaultHashtags} /></div>
              </div>
              <label className="hint" style={{ display: "block", margin: "4px 0 6px" }}>Post to</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {enabledPlatforms.length === 0 ? <span className="hint">Enable a network on the right first.</span> :
                  enabledPlatforms.map((p) => (
                    <button key={p.key} className={`btn sm ${platforms.includes(p.key) ? "primary" : ""}`} onClick={() => togglePlatform(p.key)}>{p.label}</button>
                  ))}
              </div>
              <div className="field-row two">
                <div className="field"><label>Schedule (optional)</label>
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
                <div className="field"><label>&nbsp;</label>
                  <div className="save-bar">
                    <button className="btn" onClick={() => compose(false)} disabled={busy}>Save draft</button>
                    <button className="btn primary" onClick={() => compose(true)} disabled={busy}>{scheduledAt ? "Schedule" : "Post now"}</button>
                  </div></div>
              </div>
              {msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
            </div>

            <div className="card">
              <h2>Queue &amp; history</h2>
              {posts.length === 0 ? <div className="hint">No posts yet.</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {posts.map((p) => (
                    <div key={p.id} style={{ borderBottom: "1px solid var(--a-line)", paddingBottom: 10 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span className={`badge ${p.status === "posted" ? "published" : p.status === "failed" ? "review" : "neutral"}`}>{p.status}</span>
                        {p.platforms.map((pl) => <span key={pl} className="badge desk">{pl}</span>)}
                        {p.scheduledAt && <span className="row-meta">for {new Date(p.scheduledAt).toLocaleString("en-GB")}</span>}
                      </div>
                      <div style={{ fontSize: 13 }}>{p.text}</div>
                      {p.results && <div className="row-meta" style={{ marginTop: 4 }}>{Object.entries(p.results).map(([k, r]) => `${k}: ${r.ok ? "✓" : r.detail}`).join(" · ")}</div>}
                      <div className="row-actions" style={{ justifyContent: "flex-start", marginTop: 6 }}>
                        {p.status !== "posted" && <button className="btn sm success" onClick={() => postNow(p.id)}>Post now</button>}
                        <button className="btn sm danger" onClick={() => del(p.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="editor-side">
            <div className="card">
              <h2>Connected networks</h2>
              {PLATFORMS.map((p) => (
                <div key={p.key} className="field-row" style={{ marginBottom: 8 }}>
                  <div className="field" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label} {p.key === "telegram" && telegramReady && <span className="badge published" style={{ marginLeft: 6 }}>token set</span>}</div>
                      <div className="row-meta">{p.note}</div>
                    </div>
                    <button className={`btn sm ${config.enabled[p.key] ? "primary" : ""}`} onClick={() => toggleEnabled(p.key)}>{config.enabled[p.key] ? "On" : "Off"}</button>
                  </div>
                </div>
              ))}
              <div className="field" style={{ marginTop: 8 }}><label>Telegram channel / chat id</label>
                <input type="text" value={config.telegramChatId} onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                  onBlur={() => saveConfig({ telegramChatId: config.telegramChatId })} placeholder="@ilsportspulse" /></div>
            </div>

            <div className="card">
              <h2>Auto-post</h2>
              <div className="field-row"><div className="field"><label>Auto-post new articles</label>
                <select value={config.autoPostOnPublish ? "yes" : "no"} onChange={(e) => saveConfig({ autoPostOnPublish: e.target.value === "yes" })}>
                  <option value="no">Off</option><option value="yes">On — queue a post when an article publishes</option></select></div></div>
              <div className="field-row"><div className="field"><label>Approval</label>
                <select value={config.autoPostRequiresApproval ? "yes" : "no"} onChange={(e) => saveConfig({ autoPostRequiresApproval: e.target.value === "yes" })}>
                  <option value="yes">Hold as draft for my approval</option><option value="no">Post automatically</option></select></div></div>
              <div className="field-row"><div className="field"><label>Default hashtags</label>
                <input type="text" value={config.defaultHashtags} onChange={(e) => setConfig({ ...config, defaultHashtags: e.target.value })}
                  onBlur={() => saveConfig({ defaultHashtags: config.defaultHashtags })} /></div></div>
              <div className="field-row">
                <div className="field"><label>Max auto-posts / day</label>
                  <input type="number" min={1} max={100} value={config.autoPostDailyMax}
                    onChange={(e) => setConfig({ ...config, autoPostDailyMax: Number(e.target.value) })}
                    onBlur={() => saveConfig({ autoPostDailyMax: config.autoPostDailyMax })} /></div>
                <div className="field"><label>Min minutes between posts</label>
                  <input type="number" min={0} max={720} value={config.autoPostMinGapMinutes}
                    onChange={(e) => setConfig({ ...config, autoPostMinGapMinutes: Number(e.target.value) })}
                    onBlur={() => saveConfig({ autoPostMinGapMinutes: config.autoPostMinGapMinutes })} /></div></div>
              <p className="hint">Only the strongest new story each cycle is posted (Israeli facts first), spaced out and capped — keeps the feed professional and inside the free X API tier.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
