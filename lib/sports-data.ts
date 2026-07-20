import { teamLogo } from "@/config/team-logos";
import { competitionPriority } from "@/lib/competition-priority";
import {
  getSofaDateIsraeli,
  getSofaLiveIsraeli,
  sofaScoreEnabled,
  type SofaScoreRow,
} from "@/lib/sofascore-provider";

export type ScoreEvent = {
  id: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: "LIVE" | "FT" | "SCHEDULED";
  clock?: string | null;
  startTime?: string | null;
  leagueId?: string | null;
  leagueBadge?: string | null;
  round?: string | null;
  venue?: string | null;
  articleSlug?: string | null;
  facts?: string[];
  incidents?: {
    id: string;
    type: "goal" | "card" | "substitution" | "period" | "other";
    minute?: string | null;
    team?: string | null;
    player?: string | null;
    detail?: string | null;
  }[];
  lineups?: {
    home?: string[];
    away?: string[];
    confirmed: boolean;
  };
  statistics?: {
    label: string;
    home: string | number;
    away: string | number;
  }[];
};

export type StandingRow = {
  position: number;
  team: string;
  logo?: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDifference: number;
  points: number;
  form?: string[];
};

export type ScoreCentreData = {
  provider: "demo" | "elite" | "sportmonks" | "thesportsdb";
  providerLabel: string;
  updatedAt: string;
  live: ScoreEvent[];
  recent: ScoreEvent[];
  fixtures: ScoreEvent[];
  tables: { id: string; sport: string; name: string; season: string; rows: StandingRow[] }[];
  coverage: {
    sport: string;
    competitions: string[];
    liveScores: boolean;
    standings: boolean;
  }[];
  health: "live" | "partial" | "preview" | "degraded";
  message?: string;
};

function previewData(): ScoreCentreData {
  const updatedAt = new Date().toISOString();
  return {
    provider: "demo",
    providerLabel: "Provider preview",
    updatedAt,
    health: "preview",
    message:
      "A live-data provider is not connected. No sample scores or fixtures are shown as real results.",
    coverage: [
      {
        sport: "Football",
        competitions: ["Premier League", "Liga Leumit", "Liga Alef", "State Cup", "Toto Cup", "women", "youth"],
        liveScores: false,
        standings: false,
      },
      {
        sport: "Basketball",
        competitions: ["Winner League", "National League", "women", "EuroLeague", "EuroCup", "national teams"],
        liveScores: false,
        standings: false,
      },
      {
        sport: "Handball",
        competitions: ["Winner League", "National League", "women", "cups", "national teams"],
        liveScores: false,
        standings: false,
      },
      {
        sport: "Volleyball",
        competitions: ["Premier League men", "Premier League women", "cups", "national teams"],
        liveScores: false,
        standings: false,
      },
      {
        sport: "Judo & Olympic sport",
        competitions: ["Israeli championships", "World Tour", "European and world events", "Olympics"],
        liveScores: false,
        standings: false,
      },
    ],
    live: [],
    recent: [],
    fixtures: [],
    tables: [],
  };
}

type SportsDbEvent = {
  idEvent?: string;
  idLeague?: string;
  strSport?: string;
  strLeague?: string;
  strLeagueBadge?: string | null;
  strTimestamp?: string | null;
  strHomeTeam?: string | null;
  strAwayTeam?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  intRound?: string | number | null;
  strVenue?: string | null;
  strStatus?: string | null;
};

type SportsDbStanding = {
  intRank?: string;
  strTeam?: string;
  strBadge?: string | null;
  intPlayed?: string;
  intWin?: string;
  intDraw?: string;
  intLoss?: string;
  intGoalDifference?: string;
  intPoints?: string;
  strForm?: string | null;
};

const sportsDbLeagues = [
  { id: "4644", sport: "Football", name: "Israeli Premier League", season: "2026-2027", tableSeason: "2025-2026" },
  { id: "4966", sport: "Football", name: "Liga Leumit", season: "2026-2027", tableSeason: "2025-2026" },
  { id: "4474", sport: "Basketball", name: "Israeli Basketball Premier League", season: "2025-2026" },
  { id: "5271", sport: "Basketball", name: "Basketball National League", season: "2025-2026" },
];

function numberOrNull(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapSportsDbEvent(event: SportsDbEvent): ScoreEvent {
  const state = (event.strStatus ?? "").toUpperCase();
  const isFinished = /FT|FINISH|ENDED|FINAL|AET|AOT|AFTER|PENALTIES|\bAP\b/.test(state);
  const isLive = !isFinished && /LIVE|1H|2H|HT|Q[1-4]|OT|IN PLAY/.test(state);
  const home = event.strHomeTeam ?? "Home";
  const away = event.strAwayTeam ?? "Away";
  const sport = event.strSport === "Soccer" ? "Football" : event.strSport ?? "Sport";
  const round = event.intRound ? `${sport === "Football" ? "Matchweek" : "Round"} ${event.intRound}` : null;
  return {
    id: `sportsdb-${event.idEvent ?? `${home}-${away}-${event.strTimestamp}`}`,
    leagueId: event.idLeague ?? null,
    league: event.strLeague ?? "Competition",
    leagueBadge: event.strLeagueBadge ?? null,
    sport,
    home,
    away,
    homeLogo: event.strHomeTeamBadge ?? teamLogo(home),
    awayLogo: event.strAwayTeamBadge ?? teamLogo(away),
    homeScore: numberOrNull(event.intHomeScore),
    awayScore: numberOrNull(event.intAwayScore),
    status: isLive ? "LIVE" : isFinished ? "FT" : "SCHEDULED",
    clock: isLive ? event.strStatus : null,
    startTime: event.strTimestamp ? `${event.strTimestamp.replace(/Z$/, "")}Z` : null,
    round,
    venue: event.strVenue ?? null,
    facts: [round, event.strVenue ? `Venue: ${event.strVenue}` : null]
      .filter((fact): fact is string => Boolean(fact)),
  };
}

async function sportsDbJson<T>(path: string): Promise<T> {
  const response = await fetch(`https://www.thesportsdb.com/api/v1/json/123/${path}`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`TheSportsDB returned ${response.status}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

async function theSportsDbData(): Promise<ScoreCentreData> {
  const leagueData = await Promise.all(sportsDbLeagues.map(async (league) => {
    const [seasonPayload, recentPayload, tablePayload] = await Promise.all([
      sportsDbJson<{ events?: SportsDbEvent[] | null }>(`eventsseason.php?id=${league.id}&s=${league.season}`),
      sportsDbJson<{ events?: SportsDbEvent[] | null }>(`eventspastleague.php?id=${league.id}`),
      league.tableSeason
        ? sportsDbJson<{ table?: SportsDbStanding[] | null }>(`lookuptable.php?l=${league.id}&s=${league.tableSeason}`)
        : Promise.resolve({ table: [] }),
    ]);
    return {
      league,
      events: (seasonPayload.events ?? []).map(mapSportsDbEvent),
      recent: (recentPayload.events ?? []).map(mapSportsDbEvent),
      rows: (tablePayload.table ?? []).map((row) => ({
        position: Number(row.intRank ?? 0),
        team: row.strTeam ?? "Team",
        logo: row.strBadge?.replace(/\/tiny$/, "") ?? null,
        played: Number(row.intPlayed ?? 0),
        won: Number(row.intWin ?? 0),
        drawn: Number(row.intDraw ?? 0),
        lost: Number(row.intLoss ?? 0),
        goalDifference: Number(row.intGoalDifference ?? 0),
        points: Number(row.intPoints ?? 0),
        form: row.strForm?.split("") ?? [],
      })),
    };
  }));

  const allSeasonEvents = leagueData.flatMap((item) => item.events);
  const live = allSeasonEvents.filter((event) => event.status === "LIVE");
  const fixtures = allSeasonEvents
    .filter((event) => event.status === "SCHEDULED" && (!event.startTime || new Date(event.startTime).getTime() >= Date.now()))
    .sort((a, b) => new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime());
  const recentById = new Map<string, ScoreEvent>();
  for (const event of leagueData.flatMap((item) => item.recent).filter((item) => item.status === "FT")) {
    recentById.set(event.id, event);
  }

  return {
    provider: "thesportsdb",
    providerLabel: "TheSportsDB verified schedules",
    updatedAt: new Date().toISOString(),
    health: "partial",
    message: "Verified schedules, recent results, team marks and completed football tables are connected. Two-minute live scores, line-ups, match incidents and player statistics require a licensed live package.",
    live,
    fixtures,
    recent: Array.from(recentById.values()).sort((a, b) => new Date(b.startTime ?? 0).getTime() - new Date(a.startTime ?? 0).getTime()),
    tables: leagueData
      .filter((item) => item.rows.length)
      .map((item) => ({
        id: `sportsdb-${item.league.id}`,
        sport: item.league.sport,
        name: item.league.name,
        season: `${item.league.tableSeason?.replace("-", "/")} · final`,
        rows: item.rows,
      })),
    coverage: [
      {
        sport: "Football",
        competitions: ["Israeli Premier League", "Liga Leumit", "Liga Alef", "State Cup", "Toto Cup", "women", "youth"],
        liveScores: false,
        standings: true,
      },
      {
        sport: "Basketball",
        competitions: ["Premier League", "National League", "women", "State Cup", "EuroLeague", "EuroCup"],
        liveScores: false,
        standings: false,
      },
      {
        sport: "Handball",
        competitions: ["Winner League", "National League", "women", "cups", "national teams"],
        liveScores: false,
        standings: false,
      },
      {
        sport: "Volleyball",
        competitions: ["Premier League men", "Premier League women", "cups", "national teams"],
        liveScores: false,
        standings: false,
      },
      {
        sport: "Judo & Olympic sport",
        competitions: ["Israeli championships", "World Tour", "European and world events", "Olympics"],
        liveScores: false,
        standings: false,
      },
    ],
  };
}

type EliteEvent = {
  id: string;
  sport: string | null;
  league: string | null;
  status: string | null;
  startTime: string | null;
  home: string | null;
  away: string | null;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  clock: string | null;
};

async function eliteData(): Promise<ScoreCentreData> {
  const baseUrl = process.env.ELITE_SPORTS_API_URL;
  if (!baseUrl) throw new Error("ELITE_SPORTS_API_URL is not configured");

  const cleanBase = baseUrl.replace(/\/$/, "");
  const [liveResponse, upcomingResponse] = await Promise.all([
    fetch(`${cleanBase}/api/v1/public/opticodds/events?status=LIVE&limit=50`, {
      cache: "no-store",
      headers: { "x-locale": "en" },
    }),
    fetch(
      `${cleanBase}/api/v1/public/opticodds/events?status=PREMATCH&limit=50`,
      { cache: "no-store", headers: { "x-locale": "en" } },
    ),
  ]);

  if (!liveResponse.ok || !upcomingResponse.ok) {
    throw new Error("The existing sports API did not return a healthy response");
  }

  const liveJson = (await liveResponse.json()) as { events?: EliteEvent[] };
  const upcomingJson = (await upcomingResponse.json()) as {
    events?: EliteEvent[];
  };
  const mapEvent = (event: EliteEvent): ScoreEvent => ({
    id: event.id,
    sport: event.sport ?? "Sport",
    league: event.league ?? "Competition",
    home: event.home ?? "Home",
    away: event.away ?? "Away",
    homeLogo: event.homeLogo ?? teamLogo(event.home ?? ""),
    awayLogo: event.awayLogo ?? teamLogo(event.away ?? ""),
    homeScore: event.homeScore,
    awayScore: event.awayScore,
    status: event.status === "LIVE" ? "LIVE" : "SCHEDULED",
    clock: event.clock,
    startTime: event.startTime,
  });

  return {
    ...previewData(),
    provider: "elite",
    providerLabel: "Existing FeedTheBet / OpticOdds pipeline",
    updatedAt: new Date().toISOString(),
    health: "live",
    message:
      "Scores and fixtures are live. Tables remain on preview data until a standings feed is connected.",
    coverage: previewData().coverage.map((item) => ({ ...item, liveScores: true })),
    live: (liveJson.events ?? []).map(mapEvent),
    fixtures: (upcomingJson.events ?? []).map(mapEvent),
  };
}

type SportmonksParticipant = {
  id: number;
  name: string;
  image_path?: string;
  meta?: { location?: string };
};

type SportmonksScore = {
  participant_id?: number;
  description?: string;
  score?: { goals?: number };
};

type SportmonksFixture = {
  id: number;
  name?: string;
  starting_at?: string;
  participants?: SportmonksParticipant[];
  scores?: SportmonksScore[];
  state?: { developer_name?: string; short_name?: string; name?: string };
  league?: { name?: string };
};

function mapSportmonksFixture(fixture: SportmonksFixture): ScoreEvent {
  const home = fixture.participants?.find(
    (participant) => participant.meta?.location === "home",
  );
  const away = fixture.participants?.find(
    (participant) => participant.meta?.location === "away",
  );
  const currentScores = (fixture.scores ?? []).filter(
    (score) => score.description?.toUpperCase() === "CURRENT",
  );
  const state = fixture.state?.developer_name?.toUpperCase() ?? "";
  const isLive = /INPLAY|LIVE|BREAK|HALF/.test(state);
  const isFinished = /FINISH|FT|ENDED/.test(state);
  return {
    id: String(fixture.id),
    sport: "Football",
    league: fixture.league?.name ?? "Competition",
    home: home?.name ?? fixture.name?.split(" vs ")[0] ?? "Home",
    away: away?.name ?? fixture.name?.split(" vs ")[1] ?? "Away",
    homeLogo: home?.image_path ?? teamLogo(home?.name ?? ""),
    awayLogo: away?.image_path ?? teamLogo(away?.name ?? ""),
    homeScore:
      currentScores.find((score) => score.participant_id === home?.id)?.score
        ?.goals ?? null,
    awayScore:
      currentScores.find((score) => score.participant_id === away?.id)?.score
        ?.goals ?? null,
    status: isLive ? "LIVE" : isFinished ? "FT" : "SCHEDULED",
    clock: isLive ? fixture.state?.short_name ?? fixture.state?.name : null,
    startTime: fixture.starting_at
      ? `${fixture.starting_at.replace(" ", "T")}Z`
      : null,
  };
}

type SportmonksStanding = {
  position: number;
  points: number;
  participant?: { name?: string; image_path?: string };
  details?: {
    value?: number;
    type?: { developer_name?: string; name?: string };
  }[];
};

function detailValue(row: SportmonksStanding, ...needles: string[]) {
  const detail = row.details?.find((entry) => {
    const name = `${entry.type?.developer_name ?? ""} ${entry.type?.name ?? ""}`
      .toLowerCase()
      .replace(/[ -]+/g, "_");
    return needles.some((needle) => name.includes(needle));
  });
  return Number(detail?.value ?? 0);
}

async function sportmonksData(): Promise<ScoreCentreData> {
  const token = process.env.SPORTMONKS_API_TOKEN;
  const legacySeasonId = process.env.SPORTMONKS_ISRAEL_SEASON_ID;
  let seasons: { id: string; name: string; label: string }[] = [];
  if (process.env.SPORTMONKS_ISRAEL_SEASONS) {
    try {
      seasons = (JSON.parse(process.env.SPORTMONKS_ISRAEL_SEASONS) as { id?: string | number; name?: string; label?: string }[])
        .filter((season) => season.id && season.name)
        .map((season) => ({ id: String(season.id), name: String(season.name), label: season.label ?? "Current season" }));
    } catch {
      throw new Error("SPORTMONKS_ISRAEL_SEASONS must be valid JSON");
    }
  } else if (legacySeasonId) {
    seasons = [{
      id: legacySeasonId,
      name: "Israeli Premier League",
      label: process.env.SPORTMONKS_ISRAEL_SEASON_LABEL ?? "Current season",
    }];
  }
  if (!token || !seasons.length) {
    throw new Error("Sportmonks credentials or configured Israeli seasons are missing");
  }

  const today = new Date();
  const end = new Date(today.getTime() + 14 * 86_400_000);
  const date = (value: Date) => value.toISOString().slice(0, 10);
  const params = `api_token=${encodeURIComponent(token)}`;
  const [liveResponse, ...seasonResponses] = await Promise.all([
    fetch(`https://api.sportmonks.com/v3/football/livescores/inplay?${params}&include=participants;scores;state;league`, { cache: "no-store" }),
    ...seasons.map(async (season) => {
      const [fixturesResponse, tableResponse] = await Promise.all([
        fetch(`https://api.sportmonks.com/v3/football/fixtures/between/${date(today)}/${date(end)}?${params}&include=participants;scores;state;league&filters=fixtureSeasons:${season.id}`, { cache: "no-store" }),
        fetch(`https://api.sportmonks.com/v3/football/standings/seasons/${season.id}?${params}&include=participant;details.type`, { next: { revalidate: 300 } }),
      ]);
      return { season, fixturesResponse, tableResponse };
    }),
  ]);

  if (!liveResponse.ok || seasonResponses.some(({ fixturesResponse, tableResponse }) => !fixturesResponse.ok || !tableResponse.ok)) {
    throw new Error("Sportmonks returned an unhealthy response");
  }

  const liveJson = (await liveResponse.json()) as {
    data?: SportmonksFixture[];
  };
  const seasonData = await Promise.all(seasonResponses.map(async ({ season, fixturesResponse, tableResponse }) => {
    const fixturesJson = (await fixturesResponse.json()) as { data?: SportmonksFixture[] };
    const tableJson = (await tableResponse.json()) as { data?: SportmonksStanding[] };
    const rows = (tableJson.data ?? [])
      .sort((a, b) => a.position - b.position)
      .map((row) => ({
        position: row.position,
        team: row.participant?.name ?? "Team",
        logo: row.participant?.image_path ?? teamLogo(row.participant?.name ?? ""),
        played: detailValue(row, "games_played", "matches_played"),
        won: detailValue(row, "won", "wins"),
        drawn: detailValue(row, "draw"),
        lost: detailValue(row, "lost", "loss"),
        goalDifference: detailValue(row, "goal_difference"),
        points: row.points,
      }));
    return { season, fixtures: fixturesJson.data ?? [], rows };
  }));

  return {
    provider: "sportmonks",
    providerLabel: "Sportmonks Football API",
    updatedAt: new Date().toISOString(),
    health: "live",
    live: (liveJson.data ?? []).map(mapSportmonksFixture),
    recent: [],
    fixtures: seasonData.flatMap((item) => item.fixtures).map(mapSportmonksFixture),
    tables: seasonData.map(({ season, rows }) => ({
        id: `sportmonks-${season.id}`,
        sport: "Football",
        name: season.name,
        season: season.label,
        rows,
      })),
    coverage: [
      {
        sport: "Football",
        competitions: seasons.map((season) => season.name),
        liveScores: true,
        standings: true,
      },
    ],
  };
}


// ---------------------------------------------------------------------------
// Competition ordering + ILSP-verified match centres
// The score centre lists Israeli competitions first, in a fixed editorial
// order per sport (top flight, then cups, then lower tiers, then Europe),
// mirroring how the desk orders coverage. Matches that ILSP has verified in
// its own match centres (Toto Cup, Super Cup, youth internationals) are
// merged in because no connected provider carries them.

type RecapArticle = {
  id: string;
  slug: string;
  status?: string;
  desk?: string;
  publishedAt?: string;
  matchRecap?: {
    status?: string;
    competition?: string;
    kickoff?: string;
    venue?: string;
    home?: { name?: string; score?: number; logo?: string | null };
    away?: { name?: string; score?: number; logo?: string | null };
    shootout?: { home?: number; away?: number; note?: string };
  };
  basketballRecap?: {
    status?: string;
    competition?: string;
    venue?: string;
    home?: { name?: string; score?: number; flag?: string; logo?: string | null };
    away?: { name?: string; score?: number; flag?: string; logo?: string | null };
  };
};

export async function getIlspVerifiedEvents(): Promise<ScoreEvent[]> {
  try {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const raw = await readFile(path.join(process.cwd(), "data/articles.json"), "utf8");
    const articles = JSON.parse(raw) as RecapArticle[];
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const events: ScoreEvent[] = [];
    for (const article of articles) {
      if (article.status === "review") continue;
      // Owner rule: the score centre carries Israeli-related events only, so
      // international-desk match centres stay on their article pages.
      if (article.desk === "international") continue;
      const publishedAt = Date.parse(article.publishedAt ?? "");
      if (!Number.isFinite(publishedAt) || publishedAt < cutoff) continue;
      const recap = article.matchRecap;
      if (recap?.status === "FT" && recap.home?.name && recap.away?.name) {
        const shootout = recap.shootout && Number.isFinite(recap.shootout.home) && Number.isFinite(recap.shootout.away)
          ? ` (${recap.shootout.away}-${recap.shootout.home} pens)`
          : "";
        events.push({
          id: `ilsp-${article.id}`,
          sport: "Football",
          league: recap.competition ?? "Israeli football",
          home: recap.home.name,
          away: recap.away.name,
          homeLogo: recap.home.logo ?? teamLogo(recap.home.name),
          awayLogo: recap.away.logo ?? teamLogo(recap.away.name),
          homeScore: recap.home.score ?? null,
          awayScore: recap.away.score ?? null,
          status: "FT",
          clock: shootout ? `FT${shootout}` : null,
          startTime: recap.kickoff ?? article.publishedAt ?? null,
          round: recap.competition ?? null,
          venue: recap.venue ?? null,
          articleSlug: article.slug,
          facts: [recap.competition, recap.venue ? `Venue: ${recap.venue}` : null].filter(
            (fact): fact is string => Boolean(fact),
          ),
        });
      }
      const hoop = article.basketballRecap;
      if (hoop?.status === "FT" && hoop.home?.name && hoop.away?.name) {
        events.push({
          id: `ilsp-${article.id}-basketball`,
          sport: "Basketball",
          league: hoop.competition ?? "Israeli basketball",
          home: hoop.home.name,
          away: hoop.away.name,
          homeLogo: hoop.home.logo ?? null,
          awayLogo: hoop.away.logo ?? null,
          homeScore: hoop.home.score ?? null,
          awayScore: hoop.away.score ?? null,
          status: "FT",
          startTime: article.publishedAt ?? null,
          round: hoop.competition ?? null,
          venue: hoop.venue ?? null,
          articleSlug: article.slug,
          facts: [hoop.competition, hoop.venue ? `Venue: ${hoop.venue}` : null].filter(
            (fact): fact is string => Boolean(fact),
          ),
        });
      }
    }
    return events;
  } catch {
    return [];
  }
}

function orderEvents(events: ScoreEvent[]): ScoreEvent[] {
  return [...events].sort((a, b) => {
    const priority = competitionPriority(a.sport, a.league) - competitionPriority(b.sport, b.league);
    if (priority !== 0) return priority;
    return new Date(b.startTime ?? 0).getTime() - new Date(a.startTime ?? 0).getTime();
  });
}

function matchKey(event: ScoreEvent): string {
  const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${norm(event.home)}|${norm(event.away)}|${event.startTime?.slice(0, 10) ?? ""}`;
}

function mergeIlspEvents(base: ScoreCentreData, ilspEvents: ScoreEvent[]): ScoreCentreData {
  // ILSP-verified match centres supersede provider rows for the same match:
  // connected providers do not carry Israeli cup competitions and can log the
  // fixture under the wrong competition with a stale score.
  const ilspKeys = new Set(ilspEvents.map(matchKey));
  const keptProviderRecent = base.recent.filter((event) => !ilspKeys.has(matchKey(event)));
  return {
    ...base,
    providerLabel: ilspEvents.length
      ? `${base.providerLabel} + ILSP-verified match centres`
      : base.providerLabel,
    recent: orderEvents([...keptProviderRecent, ...ilspEvents]),
    fixtures: [...base.fixtures].sort((a, b) => {
      const priority = competitionPriority(a.sport, a.league) - competitionPriority(b.sport, b.league);
      if (priority !== 0) return priority;
      return new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime();
    }),
  };
}

async function mergeSofaScore(base: ScoreCentreData): Promise<ScoreCentreData> {
  if (!sofaScoreEnabled()) return base;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const [live, todayRows, yesterdayRows] = await Promise.all([
      getSofaLiveIsraeli(),
      getSofaDateIsraeli(today),
      getSofaDateIsraeli(yesterday),
    ]);
    const toEvent = (row: SofaScoreRow): ScoreEvent => ({
      ...row,
      homeLogo: teamLogo(row.home),
      awayLogo: teamLogo(row.away),
      leagueId: null,
      articleSlug: null,
    });
    const liveEvents = live.map(toEvent);
    const dated = [...todayRows, ...yesterdayRows].map(toEvent);
    const liveKeys = new Set(liveEvents.map(matchKey));
    const sofaRecent = dated.filter((e) => e.status === "FT" && !liveKeys.has(matchKey(e)));
    const sofaFixtures = dated.filter((e) => e.status === "SCHEDULED" && !liveKeys.has(matchKey(e)));
    // SofaScore rows supersede the base provider for the same match (fresher,
    // live-capable); base rows for other matches are kept.
    const sofaKeys = new Set([...liveEvents, ...dated].map(matchKey));
    return {
      ...base,
      providerLabel: `SofaScore live feed + ${base.providerLabel}`,
      live: orderEvents([...liveEvents, ...base.live.filter((e) => !sofaKeys.has(matchKey(e)))]),
      recent: orderEvents([...sofaRecent, ...base.recent.filter((e) => !sofaKeys.has(matchKey(e)))]),
      fixtures: orderEvents([...sofaFixtures, ...base.fixtures.filter((e) => !sofaKeys.has(matchKey(e)))]),
    };
  } catch {
    return base;
  }
}

export async function getScoreCentreData(): Promise<ScoreCentreData> {
  const provider = process.env.SPORTS_DATA_PROVIDER ?? "thesportsdb";
  const ilspEvents = await getIlspVerifiedEvents();
  try {
    if (provider === "elite") return mergeIlspEvents(await eliteData(), ilspEvents);
    if (provider === "sportmonks") return mergeIlspEvents(await sportmonksData(), ilspEvents);
    if (provider === "thesportsdb")
      return mergeIlspEvents(await mergeSofaScore(await theSportsDbData()), ilspEvents);
    return mergeIlspEvents(previewData(), ilspEvents);
  } catch (error) {
    const fallback = mergeIlspEvents(previewData(), ilspEvents);
    return {
      ...fallback,
      health: "degraded",
      message:
        error instanceof Error
          ? `${error.message}. Preview data is shown instead.`
          : "The live provider is unavailable. Preview data is shown instead.",
    };
  }
}
