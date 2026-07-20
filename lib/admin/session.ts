import { createHmac, timingSafeEqual } from "node:crypto";

// Dependency-free signed session tokens for the backoffice. A token is
//   base64url(payloadJSON) "." base64url(HMAC-SHA256(payloadJSON, secret))
// The payload is not encrypted (it holds no secret — just who/role/expiry), but
// it is tamper-proof: any change invalidates the signature. Verified server-side
// only; the raw secret never reaches the browser.

export const SESSION_COOKIE = "ilsp_admin";

// Session lifetimes (seconds).
export const SESSION_TTL = 8 * 60 * 60; // 8h default
export const SESSION_TTL_REMEMBER = 30 * 24 * 60 * 60; // 30d "remember me"

export type AdminRole = "admin" | "editor" | "contributor" | "readonly";

export type SessionPayload = {
  sub: string; // username
  role: AdminRole;
  iat: number; // issued-at (unix seconds)
  exp: number; // expiry (unix seconds)
};

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  // Fail closed everywhere (incl. dev/preview) — a hardcoded fallback would let
  // anyone forge an admin session on any misconfigured deploy.
  throw new Error("ADMIN_SESSION_SECRET is missing or too short (min 16 chars).");
}

const b64url = {
  encode(input: string | Buffer): string {
    return Buffer.from(input).toString("base64url");
  },
  decode(input: string): string {
    return Buffer.from(input, "base64url").toString("utf8");
  },
};

function sign(payloadJson: string): string {
  return createHmac("sha256", getSecret()).update(payloadJson).digest("base64url");
}

export function createSessionToken(
  sub: string,
  role: AdminRole,
  ttlSeconds: number = SESSION_TTL,
): { token: string; expires: Date } {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const payload: SessionPayload = { sub, role, iat, exp };
  const payloadJson = JSON.stringify(payload);
  const token = `${b64url.encode(payloadJson)}.${sign(payloadJson)}`;
  return { token, expires: new Date(exp * 1000) };
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  let payloadJson: string;
  try {
    payloadJson = b64url.decode(encodedPayload);
  } catch {
    return null;
  }

  const expected = sign(payloadJson);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(payloadJson) as SessionPayload;
  } catch {
    return null;
  }

  if (!payload.sub || !payload.role || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
  return payload;
}
