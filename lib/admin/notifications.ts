import { readData, writeData } from "@/lib/admin/persist";
import { DEFAULT_NOTIF_CONFIG, type NotifConfig, type NotifStatus, type Notification } from "@/lib/admin/notifications-types";

export * from "@/lib/admin/notifications-types";

// Push-notification composer + app config for the future iOS/Android apps. Actual
// delivery activates when FCM/APNs credentials are present (FCM_SERVER_KEY); until
// then messages queue and the composer/segments/flags are fully manageable.

const CONFIG_REL = "data/notifications-config.json";
const QUEUE_REL = "data/notifications-queue.json";

export async function getNotifConfig(): Promise<NotifConfig> {
  const stored = await readData<Partial<NotifConfig>>(CONFIG_REL, {});
  return {
    segments: stored.segments ?? DEFAULT_NOTIF_CONFIG.segments,
    featureFlags: { ...DEFAULT_NOTIF_CONFIG.featureFlags, ...(stored.featureFlags ?? {}) },
    killSwitches: { ...DEFAULT_NOTIF_CONFIG.killSwitches, ...(stored.killSwitches ?? {}) },
    minAppVersion: stored.minAppVersion ?? DEFAULT_NOTIF_CONFIG.minAppVersion,
  };
}

export async function updateNotifConfig(patch: Partial<NotifConfig>, actor: string): Promise<NotifConfig> {
  const next = { ...(await getNotifConfig()), ...patch };
  await writeData(CONFIG_REL, next, { actor, message: `chore(backoffice): app config by ${actor}` });
  return next;
}

export async function listNotifications(): Promise<Notification[]> {
  const list = await readData<Notification[]>(QUEUE_REL, []);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createNotification(input: Omit<Notification, "id" | "createdAt" | "status"> & { status?: NotifStatus }): Promise<Notification> {
  const list = await readData<Notification[]>(QUEUE_REL, []);
  const n: Notification = { ...input, id: `ntf-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), status: input.status ?? (input.scheduledAt ? "scheduled" : "draft") };
  list.unshift(n);
  await writeData(QUEUE_REL, list, { actor: input.createdBy, message: "content: queue notification" });
  return n;
}

export async function sendNotification(id: string): Promise<Notification | null> {
  const list = await readData<Notification[]>(QUEUE_REL, []);
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const ready = Boolean(process.env.FCM_SERVER_KEY);
  list[idx] = { ...list[idx], status: ready ? "sent" : "failed", result: ready ? "Delivered via FCM" : "Set FCM_SERVER_KEY to deliver to the apps." };
  await writeData(QUEUE_REL, list, { message: "content: send notification" });
  return list[idx];
}

export async function deleteNotification(id: string): Promise<void> {
  const list = await readData<Notification[]>(QUEUE_REL, []);
  await writeData(QUEUE_REL, list.filter((n) => n.id !== id), { message: "content: delete notification" });
}
