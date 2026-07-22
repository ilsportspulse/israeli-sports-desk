"use client";

import { useEffect, useState } from "react";

type User = { username: string; role: string; createdAt: string; updatedAt: string };
type Msg = { kind: "ok" | "err"; text: string } | null;

const ROLES = ["admin", "editor", "contributor", "readonly"] as const;

// Users & permissions + self-service password change. Newly created / reset
// passwords are shown exactly once — hand them over, they are never retrievable.
export function UsersManager({ self }: { self: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [rootUsername, setRootUsername] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [oneTime, setOneTime] = useState<{ username: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<string>("editor");

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  const [recoveryUnused, setRecoveryUnused] = useState<number | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setUsers(data.users ?? []);
    setRootUsername(data.rootUsername ?? "");
    const rc = await fetch("/api/admin/users/recovery-codes", { cache: "no-store" });
    const rcData = await rc.json().catch(() => ({}));
    setRecoveryUnused(typeof rcData.unused === "number" ? rcData.unused : null);
  }
  useEffect(() => { load(); }, []);

  async function generateRecovery() {
    if (recoveryUnused && !window.confirm("Generate a new set of recovery codes? Your previous codes stop working.")) return;
    const res = await fetch("/api/admin/users/recovery-codes", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setPwMsg({ kind: "err", text: data.error || "Failed." }); return; }
    setRecoveryCodes(data.codes ?? []);
    setRecoveryUnused((data.codes ?? []).length);
  }

  async function call(path: string, init: RequestInit, okText: string): Promise<Record<string, unknown> | null> {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ kind: "err", text: (data.error as string) || "Failed." }); return null; }
      setMsg({ kind: "ok", text: okText });
      await load();
      return data;
    } finally { setBusy(false); }
  }

  async function createUser() {
    const data = await call("/api/admin/users", { method: "POST", body: JSON.stringify({ username: newName, role: newRole }) }, `User ${newName} created.`);
    if (data?.password) { setOneTime({ username: newName, password: data.password as string }); setNewName(""); }
  }

  async function resetPassword(username: string) {
    if (!window.confirm(`Generate a new password for ${username}? The old one stops working.`)) return;
    const data = await call(`/api/admin/users/${encodeURIComponent(username)}`, { method: "PATCH", body: JSON.stringify({ resetPassword: true }) }, `Password of ${username} reset.`);
    if (data?.password) setOneTime({ username, password: data.password as string });
  }

  // Manual escape hatch: the admin types the password (e.g. dictated over the
  // phone) instead of a generated one.
  async function setManualPassword(username: string) {
    const pw = window.prompt(`Type the new password for ${username} (min 10 characters). The old one stops working.`);
    if (pw === null) return;
    if (pw.length < 10) { setMsg({ kind: "err", text: "Password must be at least 10 characters." }); return; }
    await call(`/api/admin/users/${encodeURIComponent(username)}`, { method: "PATCH", body: JSON.stringify({ password: pw }) }, `Password of ${username} set.`);
  }

  async function changeRole(username: string, role: string) {
    await call(`/api/admin/users/${encodeURIComponent(username)}`, { method: "PATCH", body: JSON.stringify({ role }) }, `${username} is now ${role}.`);
  }

  async function removeUser(username: string) {
    if (!window.confirm(`Delete user ${username}?`)) return;
    await call(`/api/admin/users/${encodeURIComponent(username)}`, { method: "DELETE" }, `User ${username} deleted.`);
  }

  async function changeOwnPassword() {
    setPwMsg(null);
    const res = await fetch("/api/admin/users/password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: pwCurrent, next: pwNext }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setPwMsg({ kind: "err", text: data.error || "Failed." }); return; }
    setPwMsg({ kind: "ok", text: "Password changed. Use it from your next sign-in." });
    setPwCurrent(""); setPwNext("");
  }

  const rootListed = users.some((u) => u.username === rootUsername);

  return (
    <>
      <div className="card">
        <div className="section-head" style={{ justifyContent: "space-between" }}>
          <h2>Users &amp; permissions</h2>
          {msg && <span className={`msg ${msg.kind}`} style={{ fontSize: 12 }}>{msg.text}</span>}
        </div>

        {oneTime && (
          <div className="card" style={{ background: "#f4f9f4", borderColor: "#bcd9bc", marginBottom: 12 }}>
            <div style={{ fontSize: 13 }}>
              One-time password for <b>{oneTime.username}</b> — copy it now, it is not stored anywhere:
            </div>
            <input type="text" readOnly value={oneTime.password} style={{ fontFamily: "monospace", marginTop: 6 }} onFocus={(e) => e.currentTarget.select()} />
            <div className="save-bar" style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => { navigator.clipboard?.writeText(oneTime.password); }}>Copy</button>
              <button className="btn" onClick={() => setOneTime(null)}>Dismiss</button>
            </div>
          </div>
        )}

        <div className="table-wrap" style={{ border: "none" }}><table>
          <thead><tr><th>User</th><th>Role</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {!rootListed && rootUsername && (
              <tr>
                <td><b>{rootUsername}</b> <span className="badge neutral">root</span></td>
                <td><span className="badge published">Administrator</span></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn" disabled={busy} onClick={() => resetPassword(rootUsername)}>Reset password</button>{" "}
                  <button className="btn" disabled={busy} onClick={() => setManualPassword(rootUsername)}>Set password…</button>
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.username}>
                <td><b>{u.username}</b>{u.username === rootUsername && <> <span className="badge neutral">root</span></>}{u.username === self && <> <span className="badge published">you</span></>}</td>
                <td>
                  {u.username === rootUsername || u.username === self ? (
                    <span className="badge published">{u.role}</span>
                  ) : (
                    <select value={u.role} disabled={busy} onChange={(e) => changeRole(u.username, e.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn" disabled={busy} onClick={() => resetPassword(u.username)}>Reset password</button>{" "}
                  <button className="btn" disabled={busy} onClick={() => setManualPassword(u.username)}>Set password…</button>{" "}
                  {u.username !== rootUsername && u.username !== self && (
                    <button className="btn danger" disabled={busy} onClick={() => removeUser(u.username)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>

        <div className="field-row two" style={{ marginTop: 12 }}>
          <div className="field"><label>New username</label>
            <input type="text" placeholder="e.g. editor1" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
          <div className="field"><label>Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select></div>
        </div>
        <div className="save-bar" style={{ marginTop: 8 }}>
          <button className="btn primary" disabled={busy || newName.trim().length < 2} onClick={createUser}>Add user</button>
        </div>
        <p className="hint" style={{ marginTop: 8 }}>A strong password is generated and shown once. The root account keeps its recovery password from the server configuration.</p>
      </div>

      <div className="card">
        <h2>Change my password</h2>
        <div className="field"><label>Current password</label>
          <input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} autoComplete="current-password" /></div>
        <div className="field" style={{ marginTop: 8 }}><label>New password (min 10 characters)</label>
          <input type="password" value={pwNext} onChange={(e) => setPwNext(e.target.value)} autoComplete="new-password" /></div>
        <div className="save-bar" style={{ marginTop: 10 }}>
          {pwMsg && <span className={`msg ${pwMsg.kind}`}>{pwMsg.text}</span>}
          <button className="btn primary" disabled={pwCurrent.length === 0 || pwNext.length < 10} onClick={changeOwnPassword}>Change password</button>
        </div>
      </div>

      <div className="card">
        <div className="section-head" style={{ justifyContent: "space-between" }}>
          <h2>Recovery codes</h2>
          <span className={`badge ${recoveryUnused ? "published" : "review"}`}>
            {recoveryUnused === null ? "…" : recoveryUnused ? `${recoveryUnused} unused` : "none"}
          </span>
        </div>
        {recoveryCodes ? (
          <>
            <p className="hint" style={{ marginBottom: 8 }}>
              Save these one-time codes somewhere safe (password manager, printed note). They are shown <b>only now</b>.
              Forgot your password? Click “Forgot password?” on the sign-in page and use one code to set a new password.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6, marginBottom: 10 }}>
              {recoveryCodes.map((c) => (
                <code key={c} style={{ fontFamily: "monospace", background: "#f4f6f8", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>{c}</code>
              ))}
            </div>
            <div className="save-bar">
              <button className="btn" onClick={() => { navigator.clipboard?.writeText(recoveryCodes.join("\n")); }}>Copy all</button>
              <button className="btn" onClick={() => setRecoveryCodes(null)}>Done — I saved them</button>
            </div>
          </>
        ) : (
          <>
            <p className="hint" style={{ marginBottom: 10 }}>
              One-time codes that let you sign back in and set a new password if you ever forget it — without needing another administrator.
            </p>
            <button className="btn primary" onClick={generateRecovery}>
              {recoveryUnused ? "Generate new codes" : "Generate recovery codes"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
