// Client-safe notification types + defaults (no server/fs imports).

export type NotifConfig = {
  segments: { key: string; label: string }[];
  featureFlags: Record<string, boolean>;
  killSwitches: { scores: boolean; notifications: boolean; community: boolean };
  minAppVersion: string;
};

export type NotifStatus = "draft" | "scheduled" | "sent" | "failed";

export type Notification = {
  id: string;
  title: string;
  body: string;
  deepLink?: string;
  segment: string;
  platform: "all" | "ios" | "android";
  scheduledAt?: string;
  status: NotifStatus;
  createdAt: string;
  createdBy: string;
  result?: string;
};

export const DEFAULT_NOTIF_CONFIG: NotifConfig = {
  segments: [
    { key: "all", label: "Everyone" },
    { key: "breaking", label: "Breaking news" },
    { key: "football", label: "Football followers" },
    { key: "basketball", label: "Basketball followers" },
  ],
  featureFlags: { scoreCentre: true, community: false, predictions: false },
  killSwitches: { scores: false, notifications: false, community: false },
  minAppVersion: "1.0.0",
};
