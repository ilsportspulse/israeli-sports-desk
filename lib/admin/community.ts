import { readData, writeData } from "@/lib/admin/persist";
import { DEFAULT_COMMUNITY, type CommunityConfig } from "@/lib/admin/community-types";

export * from "@/lib/admin/community-types";

// Community & platform-module control plane. Manages WHICH interactive modules are
// enabled and HOW moderation behaves. The user-facing UGC data (accounts, comments,
// predictions) needs a database to go live; this governs it, nothing hardcoded.

const REL = "data/community.json";

export async function getCommunity(): Promise<CommunityConfig> {
  const stored = await readData<Partial<CommunityConfig>>(REL, {});
  return {
    enabled: { ...DEFAULT_COMMUNITY.enabled, ...(stored.enabled ?? {}) },
    moderation: { ...DEFAULT_COMMUNITY.moderation, ...(stored.moderation ?? {}) },
  };
}

export async function updateCommunity(patch: Partial<CommunityConfig>, actor: string): Promise<CommunityConfig> {
  const current = await getCommunity();
  const next: CommunityConfig = {
    enabled: { ...current.enabled, ...(patch.enabled ?? {}) },
    moderation: { ...current.moderation, ...(patch.moderation ?? {}) },
  };
  await writeData(REL, next, { actor, message: `chore(backoffice): community config by ${actor}` });
  return next;
}
