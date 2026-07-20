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
      </form>
    </div>
  );
}
