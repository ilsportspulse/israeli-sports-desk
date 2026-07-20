"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BrandLockup } from "@/components/brand";
import {
  ArrowIcon,
  BoltIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  TableIcon,
  TrophyIcon,
} from "@/components/icons";
import { TeamCrest } from "@/components/team-crest";
import type { ScoreCentreData, ScoreEvent } from "@/lib/sports-data";

type ScoreTab = "live" | "fixtures" | "tables";

function eventDate(value?: string | null) {
  if (!value) return { day: "TBC", time: "" };
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jerusalem",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function MatchRow({
  match,
  expanded,
  onToggle,
}: {
  match: ScoreEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const date = eventDate(match.startTime);
  const isLive = match.status === "LIVE";
  const lineupTitle = match.sport === "Football" ? "Starting XI" : "Starting line-ups";
  return (
    <div className={`match-block${expanded ? " expanded" : ""}`}>
      <button className="match-row" type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={`details-${match.id}`}>
        <div className="match-time">
          <span className={isLive ? "live-chip" : ""}>{isLive ? match.clock || "Live" : match.status === "FT" ? "FT" : date.time}</span>
          <small>{match.status === "SCHEDULED" ? date.day : match.round ?? match.league}</small>
        </div>
        <div className="match-teams">
          <div><TeamCrest name={match.home} logo={match.homeLogo} /><strong>{match.home}</strong><b>{match.homeScore ?? "–"}</b></div>
          <div><TeamCrest name={match.away} logo={match.awayLogo} alternate /><strong>{match.away}</strong><b>{match.awayScore ?? "–"}</b></div>
        </div>
        <div className="match-action">
          <span>{match.round ?? (match.venue ? "Venue confirmed" : "Match centre")}</span>
          <strong>{expanded ? "Close details" : "Open match centre"} <ArrowIcon size={15} /></strong>
        </div>
      </button>
      {expanded ? (
        <div className="match-details" id={`details-${match.id}`}>
          <section className="match-detail-panel match-facts-panel">
            <span className="detail-label">Match facts</span>
            <h3>{match.status === "FT" ? "Full-time record" : isLive ? "Live match record" : "Verified fixture"}</h3>
            <dl>
              <div><dt>Competition</dt><dd>{match.league}</dd></div>
              <div><dt>Round</dt><dd>{match.round ?? "Not supplied"}</dd></div>
              <div><dt>Venue</dt><dd>{match.venue ?? "Not supplied"}</dd></div>
              <div><dt>Jerusalem time</dt><dd>{match.startTime ? `${date.day} · ${date.time}` : "TBC"}</dd></div>
            </dl>
            {match.facts?.length ? <ul>{match.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul> : null}
          </section>

          <section className="match-detail-panel">
            <span className="detail-label">{lineupTitle}</span>
            {match.lineups?.confirmed && (match.lineups.home?.length || match.lineups.away?.length) ? (
              <div className="lineup-columns">
                <div><strong>{match.home}</strong>{match.lineups.home?.map((player, index) => <span key={player}>{index + 1}. {player}</span>)}</div>
                <div><strong>{match.away}</strong>{match.lineups.away?.map((player, index) => <span key={player}>{index + 1}. {player}</span>)}</div>
              </div>
            ) : (
              <div className="detail-empty"><ClockIcon size={20} /><strong>Not confirmed by the provider</strong><p>{lineupTitle} will appear here only after an official data feed supplies them. Israel Sports Pulse never predicts a team sheet.</p></div>
            )}
          </section>

          <section className="match-detail-panel">
            <span className="detail-label">Goals & timeline</span>
            {match.incidents?.length ? (
              <ol className="incident-list">{match.incidents.map((incident) => <li key={incident.id}><b>{incident.minute ?? ""}</b><span><strong>{incident.player ?? incident.detail ?? incident.type}</strong><small>{incident.team ?? incident.detail}</small></span></li>)}</ol>
            ) : (
              <div className="detail-empty"><BoltIcon size={20} /><strong>No verified timeline available</strong><p>Goals, cards and substitutions will populate here when the licensed incident feed is active.</p></div>
            )}
          </section>

          <section className="match-detail-panel">
            <span className="detail-label">Team statistics</span>
            {match.statistics?.length ? (
              <div className="match-stat-list">{match.statistics.map((stat) => <div key={stat.label}><b>{stat.home}</b><span>{stat.label}</span><b>{stat.away}</b></div>)}</div>
            ) : (
              <div className="detail-empty"><TableIcon size={20} /><strong>Statistics not supplied</strong><p>Possession, shots, expected goals and player data will be shown when available from the connected provider.</p></div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function ScoreCentre({ initialData }: { initialData: ScoreCentreData }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState<ScoreTab>(
    requestedTab === "fixtures" || requestedTab === "tables" ? requestedTab : "live",
  );
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [sportFilter, setSportFilter] = useState("All");
  const [leagueFilter, setLeagueFilter] = useState("All");
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [secondsToRefresh, setSecondsToRefresh] = useState(120);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/scores", { cache: "no-store" });
      if (response.ok) setData((await response.json()) as ScoreCentreData);
    } finally {
      setRefreshing(false);
      setSecondsToRefresh(120);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(refresh, 120_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsToRefresh((current) => current <= 1 ? 120 : current - 1);
    }, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setLeagueFilter("All");
    setExpandedMatch(null);
  }, [sportFilter, tab]);

  const tabMatches = useMemo(
    () => tab === "fixtures" ? data.fixtures : [...data.live, ...data.recent],
    [data.fixtures, data.live, data.recent, tab],
  );

  const leagues = useMemo(() => {
    const names = tab === "tables"
      ? data.tables.filter((table) => sportFilter === "All" || table.sport === sportFilter).map((table) => table.name)
      : tabMatches.filter((match) => sportFilter === "All" || match.sport === sportFilter).map((match) => match.league);
    return ["All", ...Array.from(new Set(names))];
  }, [data.tables, sportFilter, tab, tabMatches]);

  const matchGroups = useMemo(() => {
    const matches = sportFilter === "All"
      ? tabMatches
      : tabMatches.filter((match) => match.sport === sportFilter);
    const leagueMatches = leagueFilter === "All"
      ? matches
      : matches.filter((match) => match.league === leagueFilter);
    return leagueMatches.reduce<Record<string, ScoreEvent[]>>((groups, match) => {
      const key = match.league;
      groups[key] = [...(groups[key] ?? []), match];
      return groups;
    }, {});
  }, [leagueFilter, sportFilter, tabMatches]);

  const sports = useMemo(
    () => ["All", ...Array.from(new Set(data.coverage.map((item) => item.sport)))],
    [data.coverage],
  );
  const sportTables = sportFilter === "All"
    ? data.tables
    : data.tables.filter((table) => table.sport === sportFilter);
  const visibleTables = leagueFilter === "All"
    ? sportTables
    : sportTables.filter((table) => table.name === leagueFilter);
  const countdown = `${Math.floor(secondsToRefresh / 60)}:${String(secondsToRefresh % 60).padStart(2, "0")}`;

  return (
    <div className="score-page">
      <header className="score-page-header">
        <div className="page-width score-page-nav">
          <Link href="/" className="brand-lockup">
            <BrandLockup />
          </Link>
          <Link href="/" className="back-home"><HomeIcon size={17} /> Back to the desk</Link>
        </div>
        <div className="page-width score-page-title">
          <div>
            <span className="eyebrow inverse">Live data</span>
            <h1>Scores centre</h1>
            <p>Israeli competitions first. The world’s biggest events alongside them.</p>
          </div>
          <div className={`provider-card provider-${data.health}`}>
            <span className="provider-icon">{data.health === "live" ? <CheckIcon /> : <ClockIcon />}</span>
            <div><small>Current source</small><strong>{data.providerLabel}</strong><span>Next data check in {countdown}</span></div>
          </div>
        </div>
      </header>

      <main className="page-width score-page-main">
        {data.message ? <div className={`data-notice notice-${data.health}`}><strong>{data.health === "live" ? "Live connected" : data.health === "partial" ? "Schedules connected" : data.health === "degraded" ? "Feed fallback" : "Preview mode"}</strong><span>{data.message}</span></div> : null}
        <div className="score-tabs" role="tablist" aria-label="Scores centre views">
          <button className={tab === "live" ? "active" : ""} onClick={() => setTab("live")}><span className="tab-live-dot" /> Live & results <b>{data.live.length + data.recent.length}</b></button>
          <button className={tab === "fixtures" ? "active" : ""} onClick={() => setTab("fixtures")}><CalendarIcon size={18} /> Fixtures <b>{data.fixtures.length}</b></button>
          <button className={tab === "tables" ? "active" : ""} onClick={() => setTab("tables")}><TableIcon size={18} /> Tables <b>{data.tables.length}</b></button>
          <button className="refresh-button" onClick={refresh} disabled={refreshing}>{refreshing ? "Checking…" : "Refresh now"}</button>
        </div>
        <div className="sport-filters" aria-label="Filter the scores centre by sport">
          {sports.map((sport) => (
            <button key={sport} className={sportFilter === sport ? "active" : ""} onClick={() => setSportFilter(sport)}>
              {sport}
            </button>
          ))}
        </div>
        {leagues.length > 1 ? (
          <div className="league-filters" aria-label="Choose a competition">
            <span>Competition</span>
            <div>{leagues.map((league) => <button key={league} className={leagueFilter === league ? "active" : ""} onClick={() => setLeagueFilter(league)}>{league === "All" ? "All leagues" : league}</button>)}</div>
          </div>
        ) : null}

        {tab !== "tables" ? (
          <div className="matches-layout">
            <div className="match-groups">
              {Object.entries(matchGroups).length ? Object.entries(matchGroups).map(([league, matches]) => (
                <section key={league} className="match-group">
                  <div className="match-group-heading"><div><span className="competition-mark">{matches[0]?.leagueBadge ? <TeamCrest name={league} logo={matches[0].leagueBadge} /> : <TrophyIcon size={17} />}</span><div><small>{matches[0]?.sport}</small><h2>{league}</h2></div></div><span>{matches.length} match{matches.length === 1 ? "" : "es"}</span></div>
                  {matches.map((match) => <MatchRow key={match.id} match={match} expanded={expandedMatch === match.id} onToggle={() => setExpandedMatch((current) => current === match.id ? null : match.id)} />)}
                </section>
              )) : (
                <div className="no-live-card"><span className="radar-visual"><i /><i /><b /></span><h2>No matches are live right now</h2><p>The centre checks again automatically. Upcoming Israeli fixtures are available in the Fixtures tab.</p><button onClick={() => setTab("fixtures")}>View fixtures <ArrowIcon size={17} /></button></div>
              )}
            </div>
            <aside className="score-sidebar">
              <div className="score-sidebar-card"><span className="eyebrow">Coverage map</span><h3>The whole Israeli sports system</h3><div className="coverage-list">{data.coverage.map((item) => <div key={item.sport}><strong>{item.sport}</strong><span>{item.competitions.join(" · ")}</span><small>{item.liveScores ? "Live scores connected" : "Awaiting licensed live feed"}{item.standings ? " · tables connected" : ""}</small></div>)}</div><p>News coverage is broader than the live-data package. Scores and tables appear only when supplied by a licensed provider.</p></div>
              <div className="score-sidebar-card dark-card"><span className="eyebrow inverse">Data policy</span><h3>Scores are data, not editorial guesses.</h3><p>When the provider is unavailable, the site says so and never manufactures a score.</p></div>
            </aside>
          </div>
        ) : (
          <div className="tables-layout">
            {visibleTables.map((table) => (
              <section key={table.id} className="league-table-card">
                <div className="league-table-head"><div><span className="competition-mark"><TrophyIcon size={18} /></span><div><small>{table.season}</small><h2>{table.name}</h2></div></div><span>Jerusalem time</span></div>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Pos</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
                    <tbody>{table.rows.map((row) => <tr key={row.team}><td><span className={`position position-${row.position}`}>{row.position}</span></td><td><TeamCrest name={row.team} logo={row.logo} /><strong>{row.team}</strong></td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><b>{row.points}</b></td></tr>)}</tbody>
                  </table>
                </div>
                {data.provider === "demo" ? <p className="table-preview-note">Preview table. Live standings appear here when a standings-capable provider is configured.</p> : null}
              </section>
            ))}
            {!visibleTables.length ? <div className="no-live-card"><h2>No provider-backed table yet</h2><p>This sport is in the editorial coverage map, but a licensed standings feed has not been connected.</p></div> : null}
          </div>
        )}
      </main>
      <footer className="score-page-footer"><div className="page-width"><span>Data updated {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jerusalem" }).format(new Date(data.updatedAt))} Jerusalem</span><span>Team marks identify their clubs. Preview crests: FootyLogos; provider crests: the connected data service.</span></div></footer>
    </div>
  );
}
