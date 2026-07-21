import "server-only";

/**
 * SofaScore (via RapidAPI sofascore6) score-centre provider.
 *
 * Owner-approved external feed (Patrick, 19 Jul 2026) covering Israeli
 * competitions across football, basketball, volleyball and handball from the
 * 2026-27 season onward. This is a scoreboard source only: it never satisfies
 * the editorial full-time rule for published match reports.
 *
 * Request budget: the free Basic plan carries 500 requests/month. A local
 * day-budget guard plus short-lived caches keep usage bounded; raise
 * SOFASCORE_DAY_BUDGET only after the Ultra upgrade (300k/month).
 */

const HOST = "sofascore6.p.rapidapi.com";
const BASE = `https://${HOST}/api/sofascore/v1`;

const KEY = process.env.SOFASCORE_RAPIDAPI_KEY ?? "";
const DAY_BUDGET = Number(process.env.SOFASCORE_DAY_BUDGET ?? 400);
const LIVE_TTL_MS = Number(process.env.SOFASCORE_LIVE_TTL_MS ?? 60_000);
const LIST_TTL_MS = Number(process.env.SOFASCORE_LIST_TTL_MS ?? 15 * 60_000);

/** Israeli competitions per sport, verified against the live API on 19 Jul 2026. */
export const ISRAELI_TOURNAMENTS: Record<string, { id: number; name: string }[]> = {
  football: [
    { id: 266, name: "Israeli Premier League" },
    { id: 727, name: "Israel National League" },
    { id: 2104, name: "Israel Super Cup" },
    { id: 370, name: "State Cup" },
    { id: 9355, name: "Toto Cup Al" },
    { id: 9356, name: "Toto Cup Leumit" },
    { id: 14586, name: "Israeli Women's Football League" },
    { id: 23265, name: "Liga Alef North" },
    { id: 23266, name: "Liga Alef South" },
    { id: 28825, name: "Israel U19 Premier Division" },
  ],
  basketball: [
    { id: 1197, name: "Israeli Basketball Super League" },
    { id: 11499, name: "Israeli National League Basketball" },
    { id: 1193, name: "Israeli Basketball League Cup" },
    { id: 14525, name: "Israeli Basketball State Cup" },
    { id: 20078, name: "Israeli Women Basketball Premier League" },
  ],
  volleyball: [
    { id: 25658, name: "Premier League" },
    { id: 25744, name: "Premier League, Women" },
  ],
  handball: [
    { id: 1163, name: "Division 1" },
    { id: 29178, name: "Super League, Women" },
  ],
};

const ISRAELI_TOURNAMENT_IDS = new Set(
  Object.values(ISRAELI_TOURNAMENTS).flat().map((t) => t.id),
);

type CacheEntry = { at: number; ttl: number; value: unknown };
const cache = new Map<string, CacheEntry>();
let budgetDay = "";
let budgetUsed = 0;

function budgetAvailable(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== budgetDay) {
    budgetDay = today;
    budgetUsed = 0;
  }
  return budgetUsed < DAY_BUDGET;
}

async function get(path: string, ttl: number): Promise<unknown | null> {
  if (!KEY) return null;
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.value;
  if (!budgetAvailable()) return hit?.value ?? null;
  budgetUsed += 1;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST },
      next: { revalidate: 30 },
    });
    if (!res.ok) return hit?.value ?? null;
    const value = (await res.json()) as unknown;
    cache.set(path, { at: Date.now(), ttl, value });
    return value;
  } catch {
    return hit?.value ?? null;
  }
}

type SofaEvent = {
  id: number;
  tournament?: { name?: string; uniqueTournament?: { id?: number } };
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
  homeScore?: { current?: number };
  awayScore?: { current?: number };
  status?: { description?: string; type?: string };
  startTimestamp?: number;
};

export type SofaScoreRow = {
  id: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "LIVE" | "FT" | "SCHEDULED";
  clock: string | null;
  startTime: string | null;
};

function toRow(sport: string, e: SofaEvent): SofaScoreRow | null {
  const home = e.homeTeam?.name;
  const away = e.awayTeam?.name;
  if (!home || !away) return null;
  const type = e.status?.type ?? "";
  const status: SofaScoreRow["status"] =
    type === "inprogress" ? "LIVE" : type === "finished" ? "FT" : "SCHEDULED";
  return {
    id: `sofa-${e.id}`,
    sport,
    league: e.tournament?.name ?? "",
    home,
    away,
    homeScore: e.homeScore?.current ?? null,
    awayScore: e.awayScore?.current ?? null,
    status,
    clock: status === "LIVE" ? e.status?.description ?? null : status === "FT" ? "FT" : null,
    startTime: e.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : null,
  };
}

function isIsraeli(e: SofaEvent): boolean {
  const utId = e.tournament?.uniqueTournament?.id;
  return utId !== undefined && ISRAELI_TOURNAMENT_IDS.has(utId);
}

function asEvents(raw: unknown): SofaEvent[] {
  if (Array.isArray(raw)) return raw as SofaEvent[];
  if (raw && typeof raw === "object") {
    const o = raw as { data?: unknown; events?: unknown };
    if (Array.isArray(o.data)) return o.data as SofaEvent[];
    if (Array.isArray(o.events)) return o.events as SofaEvent[];
  }
  return [];
}

/** Live Israeli events across all configured sports. */
export async function getSofaLiveIsraeli(): Promise<SofaScoreRow[]> {
  const rows: SofaScoreRow[] = [];
  for (const sport of Object.keys(ISRAELI_TOURNAMENTS)) {
    const raw = await get(`/match/live?sport_slug=${sport}`, LIVE_TTL_MS);
    for (const e of asEvents(raw)) {
      if (!isIsraeli(e)) continue;
      const row = toRow(sport, e);
      if (row) rows.push(row);
    }
  }
  return rows;
}

/** Israeli fixtures and results for a calendar date (YYYY-MM-DD). */
export async function getSofaDateIsraeli(date: string): Promise<SofaScoreRow[]> {
  const rows: SofaScoreRow[] = [];
  for (const sport of Object.keys(ISRAELI_TOURNAMENTS)) {
    const raw = await get(`/match/list?sport_slug=${sport}&date=${date}`, LIST_TTL_MS);
    for (const e of asEvents(raw)) {
      if (!isIsraeli(e)) continue;
      const row = toRow(sport, e);
      if (row) rows.push(row);
    }
  }
  return rows;
}

export function sofaScoreEnabled(): boolean {
  return KEY.length > 0;
}
