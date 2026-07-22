import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_USERNAME, can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import type { AdminRole } from "@/lib/admin/session";
import { createUser, generatePassword, listUsers, validUsername } from "@/lib/admin/users-store";

export const runtime = "nodejs";

const ROLES: AdminRole[] = ["admin", "editor", "contributor", "readonly"];

export async function GET() {
  const session = getApiAdmin();
  if (!session || !can(session.role, "users.manage")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const users = await listUsers();
  return NextResponse.json({ users, rootUsername: ADMIN_USERNAME });
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session || !can(session.role, "users.manage")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { username?: string; role?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = (body.username ?? "").toString().trim().toLowerCase();
  const role = (body.role ?? "").toString() as AdminRole;
  if (!validUsername(username)) {
    return NextResponse.json({ error: "Username: 2-31 chars, lowercase letters/digits/._- only." }, { status: 400 });
  }
  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }
  if (username === ADMIN_USERNAME) {
    return NextResponse.json({ error: "That username is the root account — reset its password instead." }, { status: 400 });
  }

  const password = (body.password ?? "").toString() || generatePassword();
  if (password.length < 10) {
    return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
  }

  try {
    const user = await createUser(username, role, password, session.sub);
    await recordAudit({ actor: session.sub, action: "users.create", summary: `Created ${username} (${role})` });
    // The password is returned exactly once, to be handed to the new user.
    return NextResponse.json({ user, password });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 409 });
  }
}
