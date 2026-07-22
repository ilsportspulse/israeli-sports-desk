import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_USERNAME, getApiAdmin, verifyCredentials } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { setPassword, verifyStoredUser } from "@/lib/admin/users-store";

export const runtime = "nodejs";

// Change your own password. Requires the current password (store-managed or,
// for the root account, the env password). For the root account this writes a
// store-managed override; the env password remains valid as recovery.
export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { current?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const current = (body.current ?? "").toString();
  const next = (body.next ?? "").toString();
  if (next.length < 10) {
    return NextResponse.json({ error: "New password must be at least 10 characters." }, { status: 400 });
  }

  const username = session.sub;
  const currentOk =
    (await verifyStoredUser(username, current)) !== null || verifyCredentials(username, current) !== null;
  if (!currentOk) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const user = await setPassword(username, next, username, {
    createRole: username === ADMIN_USERNAME ? "admin" : session.role,
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  await recordAudit({ actor: username, action: "users.password", summary: "Changed own password" });
  return NextResponse.json({ ok: true });
}
