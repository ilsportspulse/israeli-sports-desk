// Client-safe social types + constants (no server/fs imports) so both the
// backoffice UI and the server store can share them.

export type Platform =
  | "telegram" | "x" | "instagram" | "facebook" | "threads" | "linkedin"
  | "tiktok" | "youtube" | "whatsapp" | "reddit" | "bluesky" | "mastodon" | "discord" | "pinterest";

export const PLATFORMS: { key: Platform; label: string; note: string }[] = [
  { key: "telegram", label: "Telegram", note: "Bot token + channel — free, easiest" },
  { key: "discord", label: "Discord", note: "Channel webhook — free, easy" },
  { key: "x", label: "X (Twitter)", note: "Requires an X API app" },
  { key: "instagram", label: "Instagram", note: "Business account + Graph API" },
  { key: "facebook", label: "Facebook", note: "Page + Graph API" },
  { key: "threads", label: "Threads", note: "Threads API" },
  { key: "linkedin", label: "LinkedIn", note: "Company page API" },
  { key: "bluesky", label: "Bluesky", note: "App password (AT Protocol)" },
  { key: "mastodon", label: "Mastodon", note: "Instance access token" },
  { key: "tiktok", label: "TikTok", note: "Content Posting API (video)" },
  { key: "youtube", label: "YouTube", note: "Data API (Shorts/community)" },
  { key: "whatsapp", label: "WhatsApp channel", note: "WhatsApp Business API" },
  { key: "reddit", label: "Reddit", note: "Subreddit via app credentials" },
  { key: "pinterest", label: "Pinterest", note: "Pins via API" },
];

export type SocialConfig = {
  enabled: Record<Platform, boolean>;
  telegramChatId: string;
  autoPostOnPublish: boolean;
  autoPostRequiresApproval: boolean;
  defaultHashtags: string;
  // Auto-post throttle (keeps the feed professional and inside the free X API tier):
  // at most `autoPostDailyMax` tweets per day, at least `autoPostMinGapMinutes` apart.
  autoPostDailyMax: number;
  autoPostMinGapMinutes: number;
};

export type PostStatus = "draft" | "scheduled" | "posted" | "failed";

export type SocialPost = {
  id: string;
  text: string;
  link?: string;
  hashtags?: string; // per-post override; falls back to the default hashtags
  platforms: Platform[];
  scheduledAt?: string;
  status: PostStatus;
  createdAt: string;
  createdBy: string;
  postedAt?: string;
  results?: Record<string, { ok: boolean; detail: string }>;
};

export const DEFAULT_SOCIAL: SocialConfig = {
  enabled: {
    telegram: false, discord: false, x: false, instagram: false, facebook: false, threads: false, linkedin: false,
    bluesky: false, mastodon: false, tiktok: false, youtube: false, whatsapp: false, reddit: false, pinterest: false,
  },
  telegramChatId: "",
  autoPostOnPublish: false,
  autoPostRequiresApproval: true,
  defaultHashtags: "#IsraeliSport #IsraeliFootball #Israel",
  autoPostDailyMax: 12,
  autoPostMinGapMinutes: 25,
};
