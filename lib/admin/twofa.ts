import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Admin 2FA state. The TOTP secret is sensitive, so it is stored outside git
// (data/admin-2fa.json is gitignored) locally; in production it should be a
// Vercel env var (ADMIN_TOTP_SECRET) which takes precedence here.

const FILE = path.join(process.cwd(), "data", "admin-2fa.json");

type TwoFAState = { secret: string; enabled: boolean };

async function read(): Promise<TwoFAState | null> {
  if (process.env.ADMIN_TOTP_SECRET) return { secret: process.env.ADMIN_TOTP_SECRET, enabled: true };
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return null;
  }
}

export async function is2faEnabled(): Promise<boolean> {
  const s = await read();
  return Boolean(s?.enabled && s.secret);
}

export async function get2faSecret(): Promise<string | null> {
  const s = await read();
  return s?.enabled ? s.secret : null;
}

export async function set2fa(secret: string, enabled: boolean): Promise<void> {
  // Best-effort: on a persistent host this stores the secret locally (gitignored,
  // never committed). On Vercel's read-only FS this no-ops — production 2FA is
  // provisioned via the ADMIN_TOTP_SECRET env var (read() prefers it), so the
  // setup UI must not 500 when the write can't land.
  try {
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify({ secret, enabled }, null, 2) + "\n", "utf8");
  } catch {
    if (!process.env.ADMIN_TOTP_SECRET) {
      throw new Error("Cannot persist 2FA secret on this host — set ADMIN_TOTP_SECRET as an env var instead.");
    }
  }
}

export async function disable2fa(): Promise<void> {
  await set2fa("", false);
}
