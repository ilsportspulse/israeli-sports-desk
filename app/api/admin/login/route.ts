import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  loginThrottleStatus,
  recordLoginFailure,
  recordLoginSuccess,
  verifyCredentials,
} from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import {
  SESSION_COOKIE,
  SESSION_TTL,
  SESSION_TTL_REMEMBER,
  createSessionToken,
} from "@/lib/admin/session";
import { verifyTotp } from "@/lib/admin/totp";
import { get2faSecret, is2faEnabled } from "@/lib/admin/twofa";

export const runtime = "nodejs";

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0].trim()) || req.headers.get("x-real-ip") || "local";
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  const throttle = loginThrottleStatus(key);
  if (throttle.locked) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later.", retryAfterSec: throttle.retryAfterSec },
      { status: 429 },
    );
  }

  let body: { username?: string; password?: string; remember?: boolean; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username ?? "").toString();
  const password = (body.password ?? "").toString();
  const code = (body.code ?? "").toString();
  const role = verifyCredentials(username, password);

  if (!role) {
    recordLoginFailure(key);
    await recordAudit({ actor: username || "unknown", action: "auth.login.fail", summary: "Failed login" });
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  // Second factor, if enabled.
  if (await is2faEnabled()) {
    const secret = await get2faSecret();
    if (!code) {
      return NextResponse.json({ twoFactorRequired: true, error: "Enter your 6-digit authenticator code." }, { status: 401 });
    }
    if (!secret || !verifyTotp(secret, code)) {
      recordLoginFailure(key);
      await recordAudit({ actor: username.trim(), action: "auth.2fa.fail", summary: "Failed 2FA" });
      return NextResponse.json({ twoFactorRequired: true, error: "Invalid authenticator code." }, { status: 401 });
    }
  }

  recordLoginSuccess(key);
  const ttl = body.remember ? SESSION_TTL_REMEMBER : SESSION_TTL;
  const { token, expires } = createSessionToken(username.trim(), role, ttl);

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  await recordAudit({ actor: username.trim(), action: "auth.login", summary: "Signed in" });
  return res;
}
