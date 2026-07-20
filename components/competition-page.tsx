import { ArrowIcon, HomeIcon, TableIcon } from "@/components/icons";
import { LocalizedLink as Link } from "@/components/localized-link";
import { TeamCrest } from "@/components/team-crest";
import type { Competition } from "@/lib/competitions";
import type { ScoreEvent } from "@/lib/sports-data";

type CompetitionLink = { slug: string; name: string; sport: string };

function kickoff(value?: string | null) {
  if (!value) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function MatchRow({ event }: { event: ScoreEvent }) {
  const isLive = event.status === "LIVE";
  const isFt = event.status === "FT";
  const home = event.homeScore ?? null;
  const away = event.awayScore ?? null;
  const settled = isFt && home !== null && away !== null;
  const homeWin = settled && home > away;
  const awayWin = settled && away > home;
  const status = isLive ? { cls: "live", text: event.clock || "LIVE" } : isFt ? { cls: "ft", text: event.clock ?? "FT" } : { cls: "up", text: kickoff(event.startTime) };

  return (
    <Link href={event.articleSlug ? `/article/${event.articleSlug}` : "/scores"} className="cmatch-row">
      <span className={`cmatch-status ${status.cls}`}>{isLive ? <span className="status-dot" /> : null}{status.text}</span>
      <div className="cmatch-teams">
        <div className={`cmatch-team${homeWin ? " win" : ""}${awayWin ? " lose" : ""}`}>
          <TeamCrest name={event.home} logo={event.homeLogo} />
          <span className="ct-name">{event.home}</span>
          <span className="ct-score">{home ?? "–"}</span>
        </div>
        <div className={`cmatch-team${awayWin ? " win" : ""}${homeWin ? " lose" : ""}`}>
          <TeamCrest name={event.away} logo={event.awayLogo} alternate />
          <span className="ct-name">{event.away}</span>
          <span className="ct-score">{away ?? "–"}</span>
        </div>
      </div>
      <ArrowIcon size={15} />
    </Link>
  );
}

export function CompetitionPage({
  competition,
  competitions = [],
  activeSlug,
}: {
  competition: Competition;
  competitions?: CompetitionLink[];
  activeSlug?: string;
}) {
  const { name, sport, season, live, upcoming, recent, table, articles } = competition;
  const current = activeSlug ?? competition.slug;
  const matches = [...live, ...upcoming, ...recent].slice(0, 12);
  const badge = sport.slice(0, 3).toUpperCase() || "•";

  return (
    <div className="competition-page">
      <header className="comp-hero">
        <div className="page-width">
          <div className="comp-hero-nav">
            <Link href="/scores" className="comp-crumb">{sport || "Sport"} · Israel</Link>
            <Link href="/" className="comp-back"><HomeIcon size={16} /> Home</Link>
          </div>
          <div className="comp-hero-title">
            <span className="comp-hero-badge">{badge}</span>
            <div>
              <h1>{name}</h1>
              {season ? <p className="comp-hero-sub">{season}</p> : null}
            </div>
          </div>
          {competitions.length > 1 ? (
            <nav className="comp-switch" aria-label="Switch competition">
              {competitions.map((c) => (
                <Link key={c.slug} href={`/competition/${c.slug}`} className={c.slug === current ? "on" : ""}>{c.name}</Link>
              ))}
            </nav>
          ) : null}
          <nav className="comp-hero-tabs" aria-label="Competition sections">
            <a className="on" href="#overview">Overview</a>
            <a href="#matches">Matches</a>
            <a href="#standings">Standings</a>
            <a href="#stats">Stats</a>
          </nav>
        </div>
      </header>

      <main className="page-width comp-layout" id="overview">
        <div className="comp-main">
          <div className="hero-heading" id="matches"><span className="hero-heading-bar" /><h2>Live &amp; upcoming</h2></div>
          {matches.length ? (
            <div className="card comp-matches">{matches.map((e) => <MatchRow key={e.id} event={e} />)}</div>
          ) : (
            <div className="card comp-empty"><TableIcon size={22} /><strong>No matches scheduled right now</strong><span>Fixtures appear here as soon as the data feed lists them.</span></div>
          )}

          {articles.length ? (
            <>
              <div className="hero-heading"><span className="hero-heading-bar" /><h2>Latest from this competition</h2></div>
              <div className="card comp-news">
                {articles.map((a) => (
                  <Link key={a.id} href={`/article/${a.slug}`} className="comp-news-row">
                    <div><span className="comp-news-cat">{a.category}</span><strong>{a.title}</strong></div>
                    <ArrowIcon size={15} />
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <aside className="comp-aside" id="standings">
          <div className="hero-heading"><span className="hero-heading-bar" /><h2>Standings</h2></div>
          {table.length ? (
            <div className="card comp-table">
              <div className="ctable-head"><span>#</span><span>Team</span><span>P</span><span>GD</span><span>Pts</span></div>
              {table.map((row) => (
                <div key={`${row.position}-${row.team}`} className="ctable-row">
                  <span className="ct-pos">{row.position}</span>
                  <span className="ct-team"><TeamCrest name={row.team} logo={row.logo} /><span>{row.team}</span></span>
                  <span className="ct-num">{row.played}</span>
                  <span className="ct-num">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                  <span className="ct-pts">{row.points}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="card comp-empty"><strong>Table not published</strong><span>The standings appear when the licensed feed supplies them.</span></div>
          )}
        </aside>
      </main>

      <section className="page-width comp-stats" id="stats">
        <div className="hero-heading"><span className="hero-heading-bar" /><h2>Season stats</h2></div>
        <div className="comp-stats-grid">
          <div className="card comp-empty tall"><strong>Top scorers</strong><span>Goal, assist and discipline leaders populate automatically when the licensed stats feed supplies them — never estimated by ILSP.</span></div>
          <div className="card comp-empty tall"><strong>Assists</strong><span>Awaiting the licensed player-stats feed for this competition.</span></div>
          <div className="card comp-empty tall"><strong>Records &amp; more</strong><span>Clean sheets, cards and xG will be shown here when available.</span></div>
        </div>
      </section>
    </div>
  );
}
