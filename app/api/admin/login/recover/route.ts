import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { loginThrottleStatus, recordLoginFailure, recordLoginSuccess } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { SESSION_COOKIE, SESSION_TTL, createSessionToken } from "@/lib/admin/session";
import { recoverWithCode } from "@/lib/admin/users-store";

export const runtime = "nodejs";

// Forgot-password recovery: burn a one-time recovery code, set the new password
// and sign the user in — one atomic step. Shares the login throttle so codes
// cannot be brute-forced.
export async function POST(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  const key = (fwd?.split(",")[0].trim()) || req.headers.get("x-real-ip") || "local";
  const throttle = loginThrottleStatus(key);
  if (throttle.locked) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later.", retryAfterSec: throttle.retryAfterSec },
      { status: 429 },
    );
  }

  let body: { username?: string; code?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username ?? "").toString().trim().toLowerCase();
  const code = (body.code ?? "").toString().trim();
  const newPassword = (body.newPassword ?? "").toString();
  if (!username || !code) return NextResponse.json({ error: "Username and recovery code are required." }, { status: 400 });
  if (newPassword.length < 10) {
    return NextResponse.json({ error: "New password must be at least 10 characters." }, { status: 400 });
  }

  const role = await recoverWithCode(username, code, newPassword);
  if (!role) {
    recordLoginFailure(key);
    await recordAudit({ actor: username || "unknown", action: "auth.recover.fail", summary: "Failed recovery-code attempt" });
    return NextResponse.json({ error: "Invalid username or recovery code." }, { status: 401 });
  }

  recordLoginSuccess(key);
  const { token, expires } = createSessionToken(username, role, SESSION_TTL);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  await recordAudit({ actor: username, action: "auth.recover", summary: "Signed in with a recovery code and set a new password" });
  return res;
}
