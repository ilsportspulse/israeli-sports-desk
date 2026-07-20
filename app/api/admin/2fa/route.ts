import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_USERNAME, can, getApiAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { siteConfig } from "@/config/site";
import { generateSecret, otpauthUri, verifyTotp } from "@/lib/admin/totp";
import { disable2fa, is2faEnabled, set2fa } from "@/lib/admin/twofa";

export const runtime = "nodejs";

// GET → current status + a fresh provisioning secret (only used if the admin
// chooses to enable). The candidate secret is not persisted until POST verifies it.
export async function GET() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const enabled = await is2faEnabled();
  if (enabled) return NextResponse.json({ enabled: true });
  const secret = generateSecret();
  return NextResponse.json({ enabled: false, secret, otpauth: otpauthUri(secret, ADMIN_USERNAME, siteConfig.shortName) });
}

export async function POST(req: NextRequest) {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { secret, code } = await req.json().catch(() => ({}));
  if (!secret || !verifyTotp(secret, (code ?? "").toString())) {
    return NextResponse.json({ error: "That code did not match. Check your authenticator and try again." }, { status: 422 });
  }
  await set2fa(secret, true);
  await recordAudit({ actor: session.sub, action: "auth.2fa.enable", summary: "Enabled two-factor auth" });
  return NextResponse.json({ enabled: true });
}

export async function DELETE() {
  const session = getApiAdmin();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(session.role, "settings.manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await disable2fa();
  await recordAudit({ actor: session.sub, action: "auth.2fa.disable", summary: "Disabled two-factor auth" });
  return NextResponse.json({ enabled: false });
}
