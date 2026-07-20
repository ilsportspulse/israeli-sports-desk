import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  type AdminRole,
  type SessionPayload,
  verifySessionToken,
} from "@/lib/admin/session";

// ---------------------------------------------------------------------------
// Roles & permissions
// ---------------------------------------------------------------------------
// A small capability model so UI + APIs gate on intent, not on role strings.
// Only "admin" exists today (single ADMIN_PASSWORD); the other roles are wired
// so multi-user (task: invite flow) drops in without touching call sites.

export type Capability =
  | "articles.view"
  | "articles.edit"
  | "articles.publish"
  | "articles.delete"
  | "media.manage"
  | "settings.manage"
  | "automation.manage"
  | "users.manage"
  | "moderation.manage";

const ROLE_CAPABILITIES: Record<AdminRole, Capability[]> = {
  admin: [
    "articles.view", "articles.edit", "articles.publish", "articles.delete",
    "media.manage", "settings.manage", "automation.manage", "users.manage", "moderation.manage",
  ],
  editor: [
    "articles.view", "articles.edit", "articles.publish", "articles.delete",
    "media.manage", "automation.manage", "moderation.manage",
  ],
  contributor: ["articles.view", "articles.edit", "media.manage"],
  readonly: ["articles.view"],
};

export function can(role: AdminRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Administrator",
  editor: "Editor",
  contributor: "Contributor",
  readonly: "Read-only",
};

// ---------------------------------------------------------------------------
// Password verification (single-admin, env-based for now)
// ---------------------------------------------------------------------------
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";

export function verifyCredentials(username: string, password: string): AdminRole | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return null; // not configured → deny
  // Constant-time comparison on both fields to avoid timing/user enumeration.
  const userOk = safeEqual(username.trim(), ADMIN_USERNAME);
  const passOk = safeEqual(password, expected);
  return userOk && passOk ? "admin" : null;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a comparison to keep timing roughly constant, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// Login rate-limiting + lockout (best-effort, in-memory)
// ---------------------------------------------------------------------------
// Serverless instances are ephemeral so this is a first line of defence, not a
// guarantee; a durable KV-backed limiter is a later task. Cloudflare rate-limit
// is the outer layer (see backoffice-spec §0).
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000; // 15 min rolling window
const LOCKOUT_MS = 15 * 60 * 1000; // lock 15 min after too many failures

type Attempt = { count: number; first: number; lockedUntil: number };
const attempts = new Map<string, Attempt>();

export function loginThrottleStatus(key: string): { locked: boolean; retryAfterSec: number } {
  const now = Date.now();
  const a = attempts.get(key);
  if (a && a.lockedUntil > now) {
    return { locked: true, retryAfterSec: Math.ceil((a.lockedUntil - now) / 1000) };
  }
  return { locked: false, retryAfterSec: 0 };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now, lockedUntil: 0 });
    return;
  }
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.lockedUntil = now + LOCKOUT_MS;
    a.count = 0;
    a.first = now;
  }
}

export function recordLoginSuccess(key: string): void {
  attempts.delete(key);
}

// ---------------------------------------------------------------------------
// Reading the current session (server components / route handlers)
// ---------------------------------------------------------------------------
export function getCurrentAdmin(): SessionPayload | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** For server components: returns the session or redirects to the login page. */
export function requireAdmin(returnTo?: string): SessionPayload {
  const session = getCurrentAdmin();
  if (!session) {
    const target = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/admin/login${target}`);
  }
  return session;
}

/** For route handlers: returns the session or null (caller responds 401/403). */
export function getApiAdmin(): SessionPayload | null {
  return getCurrentAdmin();
}
