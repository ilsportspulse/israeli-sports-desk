import { readData, writeData } from "@/lib/admin/persist";
import { DEFAULT_SOCIAL, type PostStatus, type SocialConfig, type SocialPost } from "@/lib/admin/social-types";

export * from "@/lib/admin/social-types";

// Social hub: compose once, publish/schedule to many networks, and optionally
// auto-post new articles. Each platform activates as soon as its credentials are
// present (Telegram = bot token; X / Instagram = their API keys) — same pattern as
// the newsroom, so nothing is hardcoded and networks plug in over time.

const CONFIG_REL = "data/social.json";
const POSTS_REL = "data/social-posts.json";

export async function getSocialConfig(): Promise<SocialConfig> {
  const stored = await readData<Partial<SocialConfig>>(CONFIG_REL, {});
  return {
    ...DEFAULT_SOCIAL,
    ...stored,
    enabled: { ...DEFAULT_SOCIAL.enabled, ...(stored.enabled ?? {}) },
  };
}

export async function updateSocialConfig(patch: Partial<SocialConfig>, actor: string): Promise<SocialConfig> {
  const next = { ...(await getSocialConfig()), ...patch };
  if (patch.enabled) next.enabled = { ...next.enabled, ...patch.enabled };
  await writeData(CONFIG_REL, next, { actor, message: `chore(backoffice): social config by ${actor}` });
  return next;
}

export async function listPosts(): Promise<SocialPost[]> {
  const posts = await readData<SocialPost[]>(POSTS_REL, []);
  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createPost(input: Omit<SocialPost, "id" | "createdAt" | "status"> & { status?: PostStatus }): Promise<SocialPost> {
  const posts = await readData<SocialPost[]>(POSTS_REL, []);
  const post: SocialPost = {
    ...input,
    id: `post-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    status: input.status ?? (input.scheduledAt ? "scheduled" : "draft"),
  };
  posts.unshift(post);
  await writeData(POSTS_REL, posts, { actor: input.createdBy, message: "content: queue social post" });
  return post;
}

export async function updatePost(id: string, patch: Partial<SocialPost>): Promise<SocialPost | null> {
  const posts = await readData<SocialPost[]>(POSTS_REL, []);
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  posts[idx] = { ...posts[idx], ...patch };
  await writeData(POSTS_REL, posts, { message: "content: update social post" });
  return posts[idx];
}

export async function getPost(id: string): Promise<SocialPost | null> {
  return (await listPosts()).find((p) => p.id === id) ?? null;
}

export async function deletePost(id: string): Promise<void> {
  const posts = await readData<SocialPost[]>(POSTS_REL, []);
  await writeData(POSTS_REL, posts.filter((p) => p.id !== id), { message: "content: delete social post" });
}
