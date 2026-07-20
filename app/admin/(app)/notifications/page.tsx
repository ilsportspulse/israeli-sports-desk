import { NotificationsComposer } from "@/components/admin/notifications-composer";
import { getNotifConfig, listNotifications } from "@/lib/admin/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [config, queue] = await Promise.all([getNotifConfig(), listNotifications()]);
  return <NotificationsComposer initialConfig={config} initialQueue={queue} fcmReady={Boolean(process.env.FCM_SERVER_KEY)} />;
}
