"use client";

import { useEffect, useState } from "react";

export function SecurityManager() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [secret, setSecret] = useState("");
  const [otpauth, setOtpauth] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/2fa", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setEnabled(Boolean(data.enabled));
    setSecret(data.secret || "");
    setOtpauth(data.otpauth || "");
  }
  useEffect(() => { load(); }, []);

  async function enable() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, code }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: data.error || "Failed." }); return; }
      setMsg({ kind: "ok", text: "Two-factor authentication enabled." });
      setCode(""); load();
    } finally { setBusy(false); }
  }

  async function disable() {
    if (!window.confirm("Disable two-factor authentication?")) return;
    setBusy(true);
    await fetch("/api/admin/2fa", { method: "DELETE" });
    setBusy(false); setMsg({ kind: "ok", text: "Two-factor authentication disabled." }); load();
  }

  return (
    <div className="card">
      <div className="section-head" style={{ justifyContent: "space-between" }}>
        <h2>Two-factor authentication</h2>
        <span className={`badge ${enabled ? "published" : "review"}`}>{enabled === null ? "…" : enabled ? "ON" : "OFF"}</span>
      </div>
      {enabled ? (
        <>
          <p className="hint" style={{ marginBottom: 12 }}>Your account is protected by an authenticator code at sign-in.</p>
          <button className="btn danger" onClick={disable} disabled={busy}>Disable 2FA</button>
        </>
      ) : (
        <>
          <ol style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 18, margin: "0 0 12px" }}>
            <li>Open your authenticator app (Google Authenticator, Authy, 1Password…).</li>
            <li>Add an account using this secret (or the setup URI):</li>
          </ol>
          <div className="field"><label>Secret key</label>
            <input type="text" readOnly value={secret} style={{ fontFamily: "monospace" }} onFocus={(e) => e.currentTarget.select()} /></div>
          <div className="field" style={{ marginTop: 8 }}><label>Setup URI</label>
            <input type="text" readOnly value={otpauth} style={{ fontFamily: "monospace", fontSize: 11 }} onFocus={(e) => e.currentTarget.select()} /></div>
          <div className="field" style={{ marginTop: 10 }}><label>Enter the 6-digit code to confirm</label>
            <input type="text" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} style={{ maxWidth: 160 }} /></div>
          <div className="save-bar" style={{ marginTop: 10 }}>
            {msg && <span className={`msg ${msg.kind}`}>{msg.text}</span>}
            <button className="btn primary" onClick={enable} disabled={busy || code.length < 6}>Enable 2FA</button>
          </div>
        </>
      )}
      {msg && enabled && <p className={`msg ${msg.kind}`} style={{ marginTop: 10 }}>{msg.text}</p>}
    </div>
  );
}
