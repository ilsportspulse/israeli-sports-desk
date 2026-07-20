import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Dependency-free TOTP (RFC 6238) for admin two-factor auth. Works with any
// authenticator app (Google Authenticator, Authy, 1Password, …).

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(bytes = 20): string {
  const buf = randomBytes(bytes);
  let bits = "";
  for (let i = 0; i < buf.length; i++) bits += buf[i].toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.replace(/=+$/, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of clean) bits += B32.indexOf(c).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

export function totp(secret: string, forTime = Date.now(), step = 30): string {
  return hotp(secret, Math.floor(forTime / 1000 / step));
}

// Accept the current code plus one step either side (clock drift tolerance).
export function verifyTotp(secret: string, token: string, forTime = Date.now()): boolean {
  const t = (token || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(t)) return false;
  const counter = Math.floor(forTime / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    const expected = hotp(secret, counter + w);
    const a = Buffer.from(expected);
    const b = Buffer.from(t);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export function otpauthUri(secret: string, account: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: "6", period: "30" });
  return `otpauth://totp/${label}?${params.toString()}`;
}
