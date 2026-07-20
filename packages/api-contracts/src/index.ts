export type ApiLocale = "en" | "he";
export type ApiDirection = "ltr" | "rtl";

export type ApiEnvelope<T> = {
  schemaVersion: "1.0";
  generatedAt: string;
  data: T;
  meta: {
    locale: ApiLocale;
    timezone: "Asia/Jerusalem";
  };
  page?: {
    nextCursor: string | null;
  };
};

export type ApiMedia = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  license: string;
  licenseUrl: string;
};

export type ApiArticleSummary = {
  schemaVersion: "1.0";
  id: string;
  slug: string;
  locale: ApiLocale;
  status: "published";
  title: string;
  dek: string;
  category: string;
  kind: "news" | "analysis" | "explainer";
  publishedAt: string;
  readMinutes: number;
  media: ApiMedia;
};

export type ApiBasketballRecap = {
  competition: string;
  status: "FT";
  tipoff: string;
  venue: string;
  city: string;
  attendance?: number;
  attendanceNote?: string;
  officials: string[];
  home: {
    name: string;
    shortName: string;
    flag?: string;
    logo?: string;
    score: number;
    quarters: number[];
  };
  away: {
    name: string;
    shortName: string;
    flag?: string;
    logo?: string;
    score: number;
    quarters: number[];
  };
  stats: Array<{ label: string; home: string; away: string }>;
  leaders: Array<{ player: string; team: string; value: string; label: string }>;
};

export type ApiFootballRecap = {
  competition: string;
  status: "FT";
  kickoff: string;
  venue: string;
  city: string;
  attendance?: number;
  attendanceNote?: string;
  referee: string;
  home: {
    name: string;
    shortName: string;
    logo?: string;
    score: number;
    coach: string;
    lineup: string[];
  };
  away: {
    name: string;
    shortName: string;
    logo?: string;
    score: number;
    coach: string;
    lineup: string[];
  };
  events: Array<{
    minute: string;
    type: "goal" | "yellow" | "second-yellow" | "red" | "var";
    team: string;
    player: string;
    detail?: string;
    score?: string;
  }>;
};

export type ApiArticleDetail = ApiArticleSummary & {
  body: string[];
  facts: string[];
  matchRecap?: ApiFootballRecap;
  basketballRecap?: ApiBasketballRecap;
};

export type ApiScoreEvent = {
  schemaVersion: "1.0";
  id: string;
  sport: string;
  competition: string;
  scheduledAt: string | null;
  status: "scheduled" | "live" | "finished";
  home: { id: string; name: string; score: number | null };
  away: { id: string; name: string; score: number | null };
  lastConfirmedAt: string;
};
