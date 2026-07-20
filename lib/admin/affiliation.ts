import { readData, writeData } from "@/lib/admin/persist";

// Affiliation & monetisation config: affiliate links (with disclosure + tracking),
// ad slots, and betting/odds compliance. Everything editable from the backoffice.

const REL = "data/affiliation.json";

export type AffiliateLink = {
  id: string;
  name: string;
  partner: string;
  url: string;
  trackingParam: string; // e.g. utm_source=ilsp
  disclosure: string;
  category: "general" | "betting";
  active: boolean;
};

export type AdSlot = {
  id: string;
  name: string;
  placement: string; // e.g. "article-top", "sidebar", "homepage-lead"
  code: string; // house ad HTML or ad-network snippet
  active: boolean;
};

export type BettingCompliance = {
  enabled: boolean;
  minAge: number;
  geoRestrict: string; // comma-separated allowed regions, blank = all
  responsibleGamblingNotice: string;
};

export type AffiliationConfig = {
  links: AffiliateLink[];
  adSlots: AdSlot[];
  betting: BettingCompliance;
};

export const DEFAULT_AFFILIATION: AffiliationConfig = {
  links: [],
  adSlots: [],
  betting: {
    enabled: false,
    minAge: 18,
    geoRestrict: "",
    responsibleGamblingNotice: "18+. Please gamble responsibly. Help: begambleaware.org",
  },
};

export async function getAffiliation(): Promise<AffiliationConfig> {
  const stored = await readData<Partial<AffiliationConfig>>(REL, {});
  return {
    links: stored.links ?? DEFAULT_AFFILIATION.links,
    adSlots: stored.adSlots ?? DEFAULT_AFFILIATION.adSlots,
    betting: { ...DEFAULT_AFFILIATION.betting, ...(stored.betting ?? {}) },
  };
}

export async function updateAffiliation(patch: Partial<AffiliationConfig>, actor: string): Promise<AffiliationConfig> {
  const next = { ...(await getAffiliation()), ...patch };
  await writeData(REL, next, { actor, message: `chore(backoffice): affiliation by ${actor}` });
  return next;
}
