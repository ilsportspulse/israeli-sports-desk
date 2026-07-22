"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function submitRecovery(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code: recoveryCode, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Recovery failed.");
        setBusy(false);
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.twoFactorRequired) setNeedCode(true);
        setError(data.error || "Sign-in failed.");
        setBusy(false);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      window.location.href = next && next.startsWith("/admin") ? next : "/admin";
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  if (recovering) {
    return (
      <div className="login-wrap">
        <form className="login-card" onSubmit={submitRecovery}>
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo" src="/brand/ilsp-mark.svg" alt="ILSP" />
            <div className="brand-text">
              <b>Israel Sports Pulse</b>
              <span>Backoffice</span>
            </div>
          </div>
          <h1>Account recovery</h1>
          <p className="sub">Use one of your one-time recovery codes to set a new password.</p>

          {error && <div className="login-err">{error}</div>}

          <div className="field">
            <label htmlFor="ru">Username</label>
            <input id="ru" type="text" autoComplete="username" value={username}
              onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="rc">Recovery code</label>
            <input id="rc" type="text" placeholder="XXXX-XXXX" autoComplete="one-time-code" value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)} required style={{ fontFamily: "monospace" }} />
          </div>
          <div className="field">
            <label htmlFor="rp">New password (min 10 characters)</label>
            <input id="rp" type="password" autoComplete="new-password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} required minLength={10} />
          </div>
          <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
            {busy ? "Recovering…" : "Set new password & sign in"}
          </button>
          <p className="sub" style={{ marginTop: 12, textAlign: "center" }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setRecovering(false); setError(""); }}>← Back to sign in</a>
          </p>
          <p className="sub" style={{ marginTop: 6, fontSize: 12 }}>
            No recovery codes? Ask an administrator to reset your password.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/brand/ilsp-mark.svg" alt="ILSP" />
          <div className="brand-text">
            <b>Israel Sports Pulse</b>
            <span>Backoffice</span>
          </div>
        </div>
        <h1>Sign in</h1>
        <p className="sub">Authorized staff only.</p>

        {error && <div className="login-err">{error}</div>}

        <div className="field">
          <label htmlFor="u">Username</label>
          <input id="u" type="text" autoComplete="username" value={username}
            onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <input id="p" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {needCode && (
          <div className="field">
            <label htmlFor="code">Authenticator code</label>
            <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code"
              value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          </div>
        )}
        <label className="remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Keep me signed in for 30 days
        </label>
        <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="sub" style={{ marginTop: 12, textAlign: "center" }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setRecovering(true); setError(""); }}>Forgot password?</a>
        </p>
      </form>
    </div>
  );
}
