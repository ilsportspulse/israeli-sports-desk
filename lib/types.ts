export type ArticleKind = "news" | "analysis" | "explainer";

export type StoryTheme =
  | "night-pitch"
  | "blue-court"
  | "stadium-red"
  | "transfer-grid"
  | "golden-hour"
  | "tactics-board"
  | "track-lines"
  | "press-box";

export type StorySource = {
  name: string;
  url: string;
  originalTitle?: string;
  author?: string;
};

export type VerificationSource = {
  label: string;
  url: string;
};

export type MediaAsset = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  license: string;
  licenseUrl: string;
  changes?: string;
  width?: number;
  height?: number;
  focalPoint?: { x: number; y: number }; // 0-100 %, for face-aware cropping (CSS object-position)
};

export type MatchTeam = {
  name: string;
  shortName: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary?: string;
  };
  score: number;
  coach?: string;
  lineup: string[];
};

export type MatchEvent = {
  minute: string;
  type: "goal" | "yellow" | "second-yellow" | "red" | "var";
  team: string;
  player: string;
  detail?: string;
  score?: string;
};

export type MatchRecap = {
  competition: string;
  status: "FT";
  kickoff: string;
  venue: string;
  city: string;
  attendance?: number;
  attendanceNote?: string;
  referee?: string;
  home: MatchTeam;
  away: MatchTeam;
  events: MatchEvent[];
  shootout?: { home: number; away: number; note?: string };
  statistics?: { label: string; home: string | number; away: string | number }[];
};

export type BasketballTeam = {
  name: string;
  shortName: string;
  flag?: string;
  logo?: string;
  score: number;
  quarters: number[];
  colors?: {
    primary: string;
    secondary?: string;
  };
};

export type BasketballStat = {
  label: string;
  home: string;
  away: string;
};

export type BasketballLeader = {
  player: string;
  team: string;
  value: string;
  label: string;
};

export type BasketballRecap = {
  competition: string;
  status: "FT";
  tipoff: string;
  venue: string;
  city: string;
  attendance?: number;
  attendanceNote?: string;
  officials: string[];
  home: BasketballTeam;
  away: BasketballTeam;
  stats: BasketballStat[];
  leaders: BasketballLeader[];
};

export type ArticleSeo = {
  metaTitle?: string;
  metaDescription?: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string[];
  focusKeyword?: string;
  noindex?: boolean;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  seo?: ArticleSeo;
  category: string;
  kind: ArticleKind;
  publishedAt: string;
  updatedAt?: string;
  readMinutes: number;
  source: StorySource;
  verificationSources?: VerificationSource[];
  body: string[];
  facts: string[];
  theme: StoryTheme;
  image?: MediaAsset;
  desk?: "israel" | "international" | "world";
  archiveDate?: string;
  archiveDisplay?: {
    home: string;
    away: string;
    score: string;
    dateLine: string;
    year: string;
  };
  video?: {
    youtubeId: string;
    title: string;
    channel: string;
    sourceUrl: string;
  };
  officialSocialPost?: {
    platform: "x" | "instagram";
    postId: string;
    url: string;
    account: string;
    title: string;
  };
  matchRecap?: MatchRecap;
  basketballRecap?: BasketballRecap;
  featured?: boolean;
  homepagePriority?: number;
  homepageReason?: string;
  dedupeKey?: string;
  trending?: number;
  aiDisclosure?: string;
  status?: "published" | "review";
  reviewReasons?: string[];
};

export type PublicArticle = Omit<
  Article,
  | "source"
  | "verificationSources"
  | "homepageReason"
  | "dedupeKey"
  | "aiDisclosure"
  | "status"
  | "reviewReasons"
>;

export type PublicArticleSummary = Pick<
  PublicArticle,
  | "id"
  | "slug"
  | "title"
  | "dek"
  | "category"
  | "kind"
  | "publishedAt"
  | "updatedAt"
  | "readMinutes"
  | "theme"
  | "image"
  | "desk"
  | "archiveDate"
  | "archiveDisplay"
  | "matchRecap"
  | "basketballRecap"
  | "featured"
  | "homepagePriority"
  | "trending"
>;
