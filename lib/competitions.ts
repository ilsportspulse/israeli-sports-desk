import type { PublicArticleSummary } from "@/lib/types";
import type { ScoreCentreData, ScoreEvent, StandingRow } from "@/lib/sports-data";

// A competition hub view: everything about one competition in one place —
// live + upcoming + recent matches, the standings table, and any related
// coverage. Built entirely from the existing score feed + published articles;
// nothing is invented. Season stats (scorers/assists) render only when the feed
// supplies them, otherwise a labelled empty state.

export type Competition = {
  slug: string;
  name: string;
  sport: string;
  season?: string;
  live: ScoreEvent[];
  upcoming: ScoreEvent[];
  recent: ScoreEvent[];
  table: StandingRow[];
  articles: PublicArticleSummary[];
};

export function competitionSlug(league: string): string {
  return league
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** All competitions present in the feed (for nav menus / static params). */
export function listCompetitions(data: ScoreCentreData): { slug: string; name: string; sport: string }[] {
  const seen = new Map<string, { slug: string; name: string; sport: string }>();
  const add = (league: string, sport: string) => {
    const slug = competitionSlug(league);
    if (slug && !seen.has(slug)) seen.set(slug, { slug, name: league, sport });
  };
  for (const e of [...data.live, ...data.recent, ...data.fixtures]) add(e.league, e.sport);
  for (const t of data.tables) add(t.name, t.sport);
  return Array.from(seen.values());
}

export function getCompetition(
  data: ScoreCentreData,
  articles: PublicArticleSummary[],
  slug: string,
): Competition | null {
  const matchSlug = (league: string) => competitionSlug(league) === slug;

  const live = data.live.filter((e) => matchSlug(e.league));
  const recent = data.recent.filter((e) => matchSlug(e.league));
  const upcoming = data.fixtures.filter((e) => matchSlug(e.league));
  const table = data.tables.find((t) => competitionSlug(t.name) === slug);

  if (!live.length && !recent.length && !upcoming.length && !table) return null;

  const name = table?.name ?? live[0]?.league ?? upcoming[0]?.league ?? recent[0]?.league ?? slug;
  const sport = table?.sport ?? live[0]?.sport ?? upcoming[0]?.sport ?? recent[0]?.sport ?? "";

  // Related coverage: articles whose category loosely matches the competition or sport.
  const related = articles
    .filter((a) => {
      const hay = `${a.category} ${a.title}`.toLowerCase();
      return hay.includes(name.toLowerCase()) || (sport && a.category.toLowerCase().includes(sport.toLowerCase()));
    })
    .slice(0, 4);

  const byKickoff = (a: ScoreEvent, b: ScoreEvent) =>
    new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime();

  return {
    slug,
    name,
    sport,
    season: table?.season,
    live,
    upcoming: [...upcoming].sort(byKickoff),
    recent,
    table: table?.rows ?? [],
    articles: related,
  };
}
