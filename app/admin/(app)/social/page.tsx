import { SocialHub } from "@/components/admin/social-hub";
import { getSocialConfig, listPosts } from "@/lib/admin/social";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const [config, posts] = await Promise.all([getSocialConfig(), listPosts()]);
  return <SocialHub initialConfig={config} initialPosts={posts} telegramReady={Boolean(process.env.TELEGRAM_BOT_TOKEN)} />;
}
