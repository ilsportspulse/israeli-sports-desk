// Client-safe community types + module registry (no server/fs imports).

export type ModuleKey =
  | "accounts" | "comments" | "reactions" | "predictions" | "liveMatchPulse"
  | "motmVoting" | "watchAlongRooms" | "fanZones" | "polls" | "quizzes" | "managerGame";

export type CommunityModule = { key: ModuleKey; label: string; note: string; phase: "P2" | "P3" };

export const COMMUNITY_MODULES: CommunityModule[] = [
  { key: "accounts", label: "User accounts & profiles", note: "Register/login, favourite teams, badges", phase: "P2" },
  { key: "comments", label: "Threaded comments", note: "Comments on articles with sort by top/new", phase: "P2" },
  { key: "reactions", label: "Reactions & upvotes", note: "Emoji reactions + upvotes", phase: "P2" },
  { key: "predictions", label: "Predict-the-score league", note: "Lock predictions → season leaderboard", phase: "P2" },
  { key: "liveMatchPulse", label: "Live Match Pulse", note: "Realtime fan reaction feed per live match", phase: "P2" },
  { key: "motmVoting", label: "Man of the Match voting", note: "Community MOTM + fan-sentiment meter", phase: "P2" },
  { key: "watchAlongRooms", label: "Watch-along rooms", note: "Moderated live chat per fixture", phase: "P3" },
  { key: "fanZones", label: "Fan zones", note: "Per-club communities, debates, polls", phase: "P3" },
  { key: "polls", label: "Polls", note: "Quick fan polls", phase: "P2" },
  { key: "quizzes", label: "Quizzes", note: "Weekly sport quiz", phase: "P3" },
  { key: "managerGame", label: "Manager game", note: "Fantasy/manager game on shared rails", phase: "P3" },
];

export type ModerationConfig = {
  aiFilter: boolean;
  humanReviewQueue: boolean;
  requireEmailVerify: boolean;
  newAccountThrottle: boolean;
  antiBrigade: boolean;
  languages: string[];
  bannedWords: string[];
};

export type CommunityConfig = {
  enabled: Record<ModuleKey, boolean>;
  moderation: ModerationConfig;
};

export const DEFAULT_COMMUNITY: CommunityConfig = {
  enabled: Object.fromEntries(COMMUNITY_MODULES.map((m) => [m.key, false])) as Record<ModuleKey, boolean>,
  moderation: {
    aiFilter: true,
    humanReviewQueue: true,
    requireEmailVerify: true,
    newAccountThrottle: true,
    antiBrigade: true,
    languages: ["en", "he", "ar"],
    bannedWords: [],
  },
};
