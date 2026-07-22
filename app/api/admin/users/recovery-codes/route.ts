import { NextResponse } from "next/server";

import { ADMIN_USERNAME, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { countUnusedRecoveryCodes, generateRecoveryCodes } from "@/lib/admin/users-store";

export const runtime = "nodejs";

// Recovery codes are strictly self-service: you can only generate codes for the
// account you are signed in as, so no admin can mint sign-in codes for someone
// else. Codes are returned exactly once.
export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const unused = await countUnusedRecoveryCodes(session.sub);
  return NextResponse.json({ unused });
}

export async function POST() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const codes = await generateRecoveryCodes(session.sub, session.sub, {
    createRole: session.sub === ADMIN_USERNAME ? "admin" : session.role,
  });
  if (!codes) return NextResponse.json({ error: "User not found." }, { status: 404 });
  await recordAudit({ actor: session.sub, action: "users.recovery.generate", summary: "Generated recovery codes" });
  return NextResponse.json({ codes });
}
