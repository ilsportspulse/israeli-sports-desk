import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { SESSION_COOKIE } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST() {
  const session = getCurrentAdmin();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  if (session) {
    await recordAudit({ actor: session.sub, action: "auth.logout", summary: "Signed out" });
  }
  return res;
}
