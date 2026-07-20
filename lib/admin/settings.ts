import { readData, writeData } from "@/lib/admin/persist";
import { siteConfig } from "@/config/site";

// Central, backoffice-editable settings. Guiding rule: nothing hardcoded — the
// public site, feeds and AI newsroom read their config from here (with the static
// siteConfig as the seed/fallback so the site never breaks if the file is absent).

const SETTINGS_REL = "data/settings.json";

export type Branding = {
  siteName: string;
  shortName: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconEmoji: string;
};

export type SeoDefaults = {
  titleTemplate: string; // e.g. "%s | Israel Sports Pulse"
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  canonicalHost: string;
  indexable: boolean; // global kill-switch (keep true in prod)
};

export type NewsroomGates = {
  enabled: boolean;
  maxCandidates: number;
  confidenceThreshold: number; // 0-1
  namecheckThreshold: number; // 0-1
  requireTwoFtSources: boolean;
  holdOnAnyDoubt: boolean;
  autoPublish: boolean; // if false, everything lands in review
};

export type ComplianceConfig = {
  founderAnonymity: boolean; // block publishing content that leaks founder identity
  bannedTerms: string[]; // personal names/handles that must never appear publicly
  aiDisclosureDefault: string; // applied to articles that don't set their own
  cookieConsent: boolean; // show a privacy/consent notice on the public site
  cookieConsentText: string;
};

export type Settings = {
  branding: Branding;
  seo: SeoDefaults;
  newsroom: NewsroomGates;
  compliance: ComplianceConfig;
  featureFlags: Record<string, boolean>;
  updatedAt?: string;
  updatedBy?: string;
};

export const DEFAULT_SETTINGS: Settings = {
  branding: {
    siteName: siteConfig.name,
    shortName: siteConfig.shortName,
    tagline: siteConfig.tagline,
    description: siteConfig.description,
    primaryColor: "#07142c",
    accentColor: "#1257f1",
    logoUrl: "/brand/ilsp-mark.svg",
    faviconEmoji: "🏆",
  },
  seo: {
    titleTemplate: `%s | ${siteConfig.name}`,
    defaultTitle: `${siteConfig.name} — ${siteConfig.tagline}`,
    defaultDescription: siteConfig.description,
    defaultOgImage: "/brand/og-default.png",
    twitterHandle: siteConfig.socialHandle,
    canonicalHost: siteConfig.primaryDomain,
    indexable: true,
  },
  newsroom: {
    enabled: true,
    maxCandidates: 6,
    confidenceThreshold: 0.92,
    namecheckThreshold: 0.9,
    requireTwoFtSources: true,
    holdOnAnyDoubt: true,
    autoPublish: false,
  },
  compliance: {
    founderAnonymity: true,
    bannedTerms: [],
    aiDisclosureDefault:
      "This article was drafted with AI assistance and fact-checked against the listed independent sources by the Israel Sports Pulse desk.",
    cookieConsent: false,
    cookieConsentText:
      "We use privacy-first, cookieless analytics. No personal data is sold or shared with third parties.",
  },
  featureFlags: {
    comments: false,
    predictions: false,
    liveMatchPulse: false,
  },
};

function merge(base: Settings, patch: Partial<Settings>): Settings {
  return {
    branding: { ...base.branding, ...(patch.branding ?? {}) },
    seo: { ...base.seo, ...(patch.seo ?? {}) },
    newsroom: { ...base.newsroom, ...(patch.newsroom ?? {}) },
    compliance: { ...base.compliance, ...(patch.compliance ?? {}) },
    featureFlags: { ...base.featureFlags, ...(patch.featureFlags ?? {}) },
    updatedAt: patch.updatedAt ?? base.updatedAt,
    updatedBy: patch.updatedBy ?? base.updatedBy,
  };
}

export async function getSettings(): Promise<Settings> {
  const stored = await readData<Partial<Settings>>(SETTINGS_REL, {});
  return merge(DEFAULT_SETTINGS, stored);
}

export async function updateSettings(patch: Partial<Settings>, actor: string): Promise<Settings> {
  const current = await getSettings();
  const next = merge(current, { ...patch, updatedAt: new Date().toISOString(), updatedBy: actor });
  await writeData(SETTINGS_REL, next, { actor, message: `chore(backoffice): settings update by ${actor}` });
  return next;
}
