import crypto from "node:crypto";

// OAuth 1.0a user-context signing for POST /2/tweets — the server-side twin of
// scripts/lib/x-post.mjs (kept identical in logic; the newsroom runner uses the
// .mjs, the backoffice API routes use this). Credentials come from env only.

export type XCreds = { apiKey: string; apiSecret: string; accessToken: string; accessSecret: string };

// RFC-3986 percent-encoding (OAuth requires !*'() encoded too).
function pct(value: string): string {
  return encodeURIComponent(value).replace(/[!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function oauthHeader(method: string, url: string, creds: XCreds): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };
  const base = Object.keys(oauth).sort().map((k) => `${pct(k)}=${pct(oauth[k])}`).join("&");
  const sigBase = [method.toUpperCase(), pct(url), pct(base)].join("&");
  const signingKey = `${pct(creds.apiSecret)}&${pct(creds.accessSecret)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", signingKey).update(sigBase).digest("base64");
  return "OAuth " + Object.keys(oauth).sort().map((k) => `${pct(k)}="${pct(oauth[k])}"`).join(", ");
}

export function xCredsFromEnv(): XCreds | null {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  if (X_API_KEY && X_API_SECRET && X_ACCESS_TOKEN && X_ACCESS_SECRET) {
    return { apiKey: X_API_KEY, apiSecret: X_API_SECRET, accessToken: X_ACCESS_TOKEN, accessSecret: X_ACCESS_SECRET };
  }
  return null;
}

export async function postTweet(text: string, creds: XCreds): Promise<{ ok: boolean; id?: string; detail: string }> {
  const url = "https://api.twitter.com/2/tweets";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: oauthHeader("POST", url, creds), "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const id = (data as { data?: { id?: string } })?.data?.id;
    if (res.ok && id) return { ok: true, id, detail: `tweet ${id}` };
    const err = data as { detail?: string; title?: string; errors?: { message?: string }[] };
    return { ok: false, detail: err.detail || err.title || err.errors?.[0]?.message || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
