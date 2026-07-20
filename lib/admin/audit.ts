import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

// Append-only audit trail: who changed what, when. This is a RUNTIME LOG, not
// content — it must NOT go through the git-commit persistence path, or every
// admin action (including each login) would trigger a production redeploy. It is
// written best-effort to the local filesystem (gitignored); on a persistent host
// it accumulates, on Vercel's ephemeral FS it is per-instance. Move to KV/DB when
// durable cross-instance audit is required.

const AUDIT_DIR = path.join(process.cwd(), "data");
const AUDIT_PATH = path.join(AUDIT_DIR, "admin-audit.jsonl");
const MAX_RETURN = 300;

export type AuditEntry = {
  ts: string;
  actor: string;
  action: string;
  target?: string;
  summary?: string;
  meta?: Record<string, unknown>;
};

export async function recordAudit(entry: Omit<AuditEntry, "ts"> & { ts?: string }): Promise<void> {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
  try {
    await mkdir(AUDIT_DIR, { recursive: true });
    await appendFile(AUDIT_PATH, line, "utf8");
  } catch {
    // Never let audit logging break an admin action.
  }
}

export async function getAuditLog(limit = 100): Promise<AuditEntry[]> {
  try {
    const raw = await readFile(AUDIT_PATH, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const entries: AuditEntry[] = [];
    for (const l of lines.slice(-Math.min(limit, MAX_RETURN))) {
      try { entries.push(JSON.parse(l)); } catch { /* skip */ }
    }
    return entries.reverse();
  } catch {
    return [];
  }
}
