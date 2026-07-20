import { readEvents, type AnalyticsEvent } from "@/lib/analytics/track";

export type Metric = { key: string; label?: string; count: number };
export type AnalyticsSummary = {
  windowDays: number;
  totalViews: number;
  uniqueVisitors: number; // distinct daily visitor ids in the window
  viewsToday: number;
  visitorsToday: number;
  botViews: number;
  liveNow: number; // distinct visitors active in the last 5 min
  livePaths: Metric[];
  perDay: Metric[];
  topPages: Metric[];
  topArticles: Metric[];
  referrerTypes: Metric[];
  topReferrers: Metric[];
  countries: Metric[];
  devices: Metric[];
  browsers: Metric[];
  os: Metric[];
  campaigns: Metric[];
};

function tally(items: (string | undefined)[]): Metric[] {
  const m = new Map<string, number>();
  for (const it of items) {
    if (!it) continue;
    m.set(it, (m.get(it) ?? 0) + 1);
  }
  return Array.from(m.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

export async function getAnalyticsSummary(windowDays = 14): Promise<AnalyticsSummary> {
  const events = await readEvents(windowDays);
  const human = events.filter((e) => !e.bot);
  const bots = events.filter((e) => e.bot);
  const today = new Date().toISOString().slice(0, 10);
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;

  const todays = human.filter((e) => e.day === today);
  const live = human.filter((e) => Date.parse(e.ts) >= fiveMinAgo);

  const perDayMap = new Map<string, number>();
  for (const e of human) perDayMap.set(e.day, (perDayMap.get(e.day) ?? 0) + 1);
  const perDay = Array.from(perDayMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, count]) => ({ key, count }));

  const articleTitle = new Map<string, string>();
  for (const e of human) if (e.path.startsWith("/article/") && e.title) articleTitle.set(e.path, e.title);

  const label = (e: AnalyticsEvent) => (e.refType === "referral" || e.refType === "search" || e.refType === "social" ? e.refDomain : undefined);

  return {
    windowDays,
    totalViews: human.length,
    uniqueVisitors: new Set(human.map((e) => e.vid)).size,
    viewsToday: todays.length,
    visitorsToday: new Set(todays.map((e) => e.vid)).size,
    botViews: bots.length,
    liveNow: new Set(live.map((e) => e.vid)).size,
    livePaths: tally(live.map((e) => e.path)).slice(0, 8),
    perDay,
    topPages: tally(human.map((e) => e.path)).slice(0, 12),
    topArticles: tally(human.filter((e) => e.path.startsWith("/article/")).map((e) => e.path))
      .slice(0, 12)
      .map((m) => ({ ...m, label: articleTitle.get(m.key) })),
    referrerTypes: tally(human.map((e) => e.refType)),
    topReferrers: tally(human.map(label)).slice(0, 10),
    countries: tally(human.map((e) => e.country)).slice(0, 10),
    devices: tally(human.map((e) => e.device)),
    browsers: tally(human.map((e) => e.browser)),
    os: tally(human.map((e) => e.os)),
    campaigns: tally(human.map((e) => e.utmCampaign)).slice(0, 10),
  };
}
