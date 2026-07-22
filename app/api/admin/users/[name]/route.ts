import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_USERNAME, can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import type { AdminRole } from "@/lib/admin/session";
import { deleteUser, generatePassword, setPassword, setRole } from "@/lib/admin/users-store";

export const runtime = "nodejs";

const ROLES: AdminRole[] = ["admin", "editor", "contributor", "readonly"];

type Params = { params: { name: string } };

// PATCH { role } → change role; PATCH { resetPassword: true } → new generated
// password, returned exactly once. The root username accepts password resets
// (stored override; the env password keeps working as recovery) but no role
// change or deletion.
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session || !can(session.role, "users.manage")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const username = decodeURIComponent(params.name).toLowerCase();

  let body: { role?: string; resetPassword?: boolean; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Manual set (admin types the password) or reset (generated, returned once).
  if (body.resetPassword || typeof body.password === "string") {
    const manual = typeof body.password === "string";
    if (manual && (body.password as string).length < 10) {
      return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
    }
    const password = manual ? (body.password as string) : generatePassword();
    const user = await setPassword(username, password, session.sub, {
      createRole: username === ADMIN_USERNAME ? "admin" : undefined,
    });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    await recordAudit({ actor: session.sub, action: "users.reset", summary: `${manual ? "Set" : "Reset"} password of ${username}` });
    // Manual passwords are not echoed back — the admin already knows them.
    return NextResponse.json(manual ? { user } : { user, password });
  }

  if (body.role) {
    const role = body.role as AdminRole;
    if (!ROLES.includes(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    if (username === ADMIN_USERNAME) {
      return NextResponse.json({ error: "The root account is always an administrator." }, { status: 400 });
    }
    if (username === session.sub) {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }
    const user = await setRole(username, role, session.sub);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    await recordAudit({ actor: session.sub, action: "users.role", summary: `Set ${username} to ${role}` });
    return NextResponse.json({ user });
  }

  return NextResponse.json({ error: "Nothing to do." }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = getApiAdmin();
  if (!session || !can(session.role, "users.manage")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const username = decodeURIComponent(params.name).toLowerCase();
  if (username === ADMIN_USERNAME) {
    return NextResponse.json({ error: "The root account cannot be deleted." }, { status: 400 });
  }
  if (username === session.sub) {
    return NextResponse.json({ error: "You cannot delete yourself." }, { status: 400 });
  }
  const ok = await deleteUser(username, session.sub);
  if (!ok) return NextResponse.json({ error: "User not found." }, { status: 404 });
  await recordAudit({ actor: session.sub, action: "users.delete", summary: `Deleted ${username}` });
  return NextResponse.json({ ok: true });
}
