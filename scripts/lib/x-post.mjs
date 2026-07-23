// Post a tweet to X (Twitter) using OAuth 1.0a user-context signing — the same
// auth flow X's own clients use for POST /2/tweets. No third-party SDK: just
// node:crypto, so it runs in the GitHub Actions newsroom runner unchanged.
//
// Credentials (from your X Developer app, "Read and write" permission):
//   X_API_KEY         — API Key (consumer key)
//   X_API_SECRET      — API Key Secret (consumer secret)
//   X_ACCESS_TOKEN    — Access Token (for the @ilsportspulse account)
//   X_ACCESS_SECRET   — Access Token Secret
// All four are required; with any missing, xCredsFromEnv() returns null and the
// caller simply skips posting (never throws).

import crypto from "node:crypto";

// RFC-3986 percent-encoding (encodeURIComponent leaves !*'() alone; OAuth needs them encoded).
function pct(value) {
  return encodeURIComponent(String(value)).replace(/[!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function oauthHeader({ method, url, consumerKey, consumerSecret, token, tokenSecret }) {
  const oauth = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: "1.0",
  };
  // For a JSON-body request the signature base includes only the oauth_* params.
  const base = Object.keys(oauth).sort().map((k) => `${pct(k)}=${pct(oauth[k])}`).join("&");
  const sigBase = [method.toUpperCase(), pct(url), pct(base)].join("&");
  const signingKey = `${pct(consumerSecret)}&${pct(tokenSecret)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", signingKey).update(sigBase).digest("base64");
  return "OAuth " + Object.keys(oauth).sort().map((k) => `${pct(k)}="${pct(oauth[k])}"`).join(", ");
}

// Read the four X credentials from an env-like object; returns null unless all present.
export function xCredsFromEnv(env = process.env) {
  const apiKey = env.X_API_KEY;
  const apiSecret = env.X_API_SECRET;
  const accessToken = env.X_ACCESS_TOKEN;
  const accessSecret = env.X_ACCESS_SECRET;
  if (apiKey && apiSecret && accessToken && accessSecret) return { apiKey, apiSecret, accessToken, accessSecret };
  return null;
}

// Post a single tweet. Returns { ok, id } on success or { ok:false, detail } on failure.
export async function postTweet(text, creds) {
  const url = "https://api.twitter.com/2/tweets";
  const header = oauthHeader({
    method: "POST",
    url,
    consumerKey: creds.apiKey,
    consumerSecret: creds.apiSecret,
    token: creds.accessToken,
    tokenSecret: creds.accessSecret,
  });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: header, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.data?.id) return { ok: true, id: data.data.id };
    return { ok: false, detail: data?.detail || data?.title || data?.errors?.[0]?.message || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
