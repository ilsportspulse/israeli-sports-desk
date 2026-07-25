"use client";

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
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedLink as Link } from "@/components/localized-link";
import { TeamCrest } from "@/components/team-crest";
import { t, translator } from "@/lib/i18n/ui";
import { defaultLocale, type LocaleCode } from "@/lib/locales";
import type { ScoreCentreData, ScoreEvent } from "@/lib/sports-data";

type ScoreTab = "live" | "fixtures" | "tables";

// Score-centre-specific copy that has no home in the shared UI dictionary.
const SC: Record<LocaleCode, Record<string, string>> = {
  en: {
    startingXI: "Starting XI", startingLineups: "Starting line-ups", live: "Live",
    venueConfirmed: "Venue confirmed", matchCentre: "Match centre",
    closeDetails: "Close details", openMatchCentre: "Open match centre",
    matchFacts: "Match facts", ftRecord: "Full-time record", liveRecord: "Live match record", verifiedFixture: "Verified fixture",
    competition: "Competition", round: "Round", venue: "Venue", jerusalemTime: "Jerusalem time",
    notSupplied: "Not supplied", notConfirmed: "Not confirmed by the provider",
    lineupsEmpty: "will appear here only after an official data feed supplies them. Israel Sports Pulse never predicts a team sheet.",
    goalsTimeline: "Goals & timeline", noTimeline: "No verified timeline available",
    noTimelineSub: "Goals, cards and substitutions will populate here when the licensed incident feed is active.",
    teamStats: "Team statistics", statsNotSupplied: "Statistics not supplied",
    statsNotSuppliedSub: "Possession, shots, expected goals and player data will be shown when available from the connected provider.",
    liveData: "Live data", scoresCentre: "Scores centre",
    scoresIntro: "Israeli competitions first. The world’s biggest events alongside them.",
    currentSource: "Current source", nextCheck: "Next data check in",
    liveConnected: "Live connected", schedulesConnected: "Schedules connected", feedFallback: "Feed fallback", previewMode: "Preview mode",
    liveResults: "Live & results", checking: "Checking…", refreshNow: "Refresh now",
    competitionLabel: "Competition", allLeagues: "All leagues", match: "match", matches: "matches",
    noLive: "No matches are live right now",
    noLiveSub: "The centre checks again automatically. Upcoming Israeli fixtures are available in the Fixtures tab.",
    viewFixtures: "View fixtures", coverageMap: "Coverage map", wholeSystem: "The whole Israeli sports system",
    liveScoresConnected: "Live scores connected", awaitingFeed: "Awaiting licensed live feed", tablesConnected: " · tables connected",
    coverageNote: "News coverage is broader than the live-data package. Scores and tables appear only when supplied by a licensed provider.",
    dataPolicy: "Data policy", dataPolicyTitle: "Scores are data, not editorial guesses.",
    dataPolicySub: "When the provider is unavailable, the site says so and never manufactures a score.",
    club: "Club", previewTable: "Preview table. Live standings appear here when a standings-capable provider is configured.",
    noTable: "No provider-backed table yet",
    noTableSub: "This sport is in the editorial coverage map, but a licensed standings feed has not been connected.",
    dataUpdated: "Data updated", jerusalem: "Jerusalem",
    crestNote: "Team marks identify their clubs. Preview crests: FootyLogos; provider crests: the connected data service.",
    scoresViews: "Scores centre views", filterBySport: "Filter the scores centre by sport", chooseCompetition: "Choose a competition",
  },
  fr: {
    startingXI: "Onze de départ", startingLineups: "Compositions de départ", live: "En direct",
    venueConfirmed: "Stade confirmé", matchCentre: "Centre du match",
    closeDetails: "Fermer les détails", openMatchCentre: "Ouvrir le centre du match",
    matchFacts: "Faits du match", ftRecord: "Résultat final", liveRecord: "Suivi en direct", verifiedFixture: "Match vérifié",
    competition: "Compétition", round: "Journée", venue: "Stade", jerusalemTime: "Heure de Jérusalem",
    notSupplied: "Non communiqué", notConfirmed: "Non confirmé par le fournisseur",
    lineupsEmpty: "n’apparaîtront ici qu’après leur communication par un flux de données officiel. Israel Sports Pulse ne prédit jamais une composition.",
    goalsTimeline: "Buts & chronologie", noTimeline: "Aucune chronologie vérifiée disponible",
    noTimelineSub: "Les buts, cartons et remplacements s’afficheront ici lorsque le flux d’événements sous licence sera actif.",
    teamStats: "Statistiques d’équipe", statsNotSupplied: "Statistiques non communiquées",
    statsNotSuppliedSub: "La possession, les tirs, les buts attendus et les données joueurs s’afficheront lorsque le fournisseur connecté les fournira.",
    liveData: "Données en direct", scoresCentre: "Centre des scores",
    scoresIntro: "Les compétitions israéliennes d’abord. Les plus grands événements du monde à leurs côtés.",
    currentSource: "Source actuelle", nextCheck: "Prochaine vérification dans",
    liveConnected: "Direct connecté", schedulesConnected: "Calendriers connectés", feedFallback: "Flux de secours", previewMode: "Mode aperçu",
    liveResults: "En direct & résultats", checking: "Vérification…", refreshNow: "Actualiser",
    competitionLabel: "Compétition", allLeagues: "Toutes les ligues", match: "match", matches: "matchs",
    noLive: "Aucun match en direct pour le moment",
    noLiveSub: "Le centre vérifie à nouveau automatiquement. Les prochains matchs israéliens sont disponibles dans l’onglet Calendrier.",
    viewFixtures: "Voir le calendrier", coverageMap: "Carte de couverture", wholeSystem: "Tout le système sportif israélien",
    liveScoresConnected: "Scores en direct connectés", awaitingFeed: "En attente d’un flux en direct sous licence", tablesConnected: " · classements connectés",
    coverageNote: "La couverture éditoriale est plus large que le forfait de données en direct. Les scores et classements n’apparaissent que lorsqu’ils sont fournis par un fournisseur sous licence.",
    dataPolicy: "Politique des données", dataPolicyTitle: "Les scores sont des données, pas des suppositions éditoriales.",
    dataPolicySub: "Lorsque le fournisseur est indisponible, le site le signale et ne fabrique jamais de score.",
    club: "Club", previewTable: "Classement d’aperçu. Le classement en direct s’affiche ici lorsqu’un fournisseur de classements est configuré.",
    noTable: "Aucun classement fourni pour l’instant",
    noTableSub: "Ce sport figure dans la carte de couverture éditoriale, mais aucun flux de classement sous licence n’a été connecté.",
    dataUpdated: "Données mises à jour", jerusalem: "Jérusalem",
    crestNote: "Les écussons identifient les clubs. Écussons d’aperçu : FootyLogos ; écussons fournisseur : le service de données connecté.",
    scoresViews: "Vues du centre des scores", filterBySport: "Filtrer le centre des scores par sport", chooseCompetition: "Choisir une compétition",
  },
  es: {
    startingXI: "Once inicial", startingLineups: "Alineaciones iniciales", live: "En directo",
    venueConfirmed: "Estadio confirmado", matchCentre: "Centro del partido",
    closeDetails: "Cerrar detalles", openMatchCentre: "Abrir el centro del partido",
    matchFacts: "Datos del partido", ftRecord: "Resultado final", liveRecord: "Seguimiento en directo", verifiedFixture: "Partido verificado",
    competition: "Competición", round: "Jornada", venue: "Estadio", jerusalemTime: "Hora de Jerusalén",
    notSupplied: "No facilitado", notConfirmed: "No confirmado por el proveedor",
    lineupsEmpty: "solo aparecerán aquí cuando las facilite un proveedor de datos oficial. Israel Sports Pulse nunca predice una alineación.",
    goalsTimeline: "Goles y cronología", noTimeline: "No hay cronología verificada disponible",
    noTimelineSub: "Los goles, tarjetas y sustituciones aparecerán aquí cuando el proveedor de incidencias con licencia esté activo.",
    teamStats: "Estadísticas de equipo", statsNotSupplied: "Estadísticas no facilitadas",
    statsNotSuppliedSub: "La posesión, los tiros, los goles esperados y los datos de jugadores se mostrarán cuando el proveedor conectado los facilite.",
    liveData: "Datos en directo", scoresCentre: "Centro de resultados",
    scoresIntro: "Las competiciones israelíes primero. Los mayores eventos del mundo junto a ellas.",
    currentSource: "Fuente actual", nextCheck: "Próxima comprobación en",
    liveConnected: "Directo conectado", schedulesConnected: "Calendarios conectados", feedFallback: "Fuente de respaldo", previewMode: "Modo de vista previa",
    liveResults: "En directo y resultados", checking: "Comprobando…", refreshNow: "Actualizar ahora",
    competitionLabel: "Competición", allLeagues: "Todas las ligas", match: "partido", matches: "partidos",
    noLive: "No hay partidos en directo ahora mismo",
    noLiveSub: "El centro vuelve a comprobar automáticamente. Los próximos partidos israelíes están disponibles en la pestaña Calendario.",
    viewFixtures: "Ver calendario", coverageMap: "Mapa de cobertura", wholeSystem: "Todo el sistema deportivo israelí",
    liveScoresConnected: "Resultados en directo conectados", awaitingFeed: "A la espera de un proveedor en directo con licencia", tablesConnected: " · clasificaciones conectadas",
    coverageNote: "La cobertura informativa es más amplia que el paquete de datos en directo. Los resultados y clasificaciones solo aparecen cuando los facilita un proveedor con licencia.",
    dataPolicy: "Política de datos", dataPolicyTitle: "Los resultados son datos, no suposiciones editoriales.",
    dataPolicySub: "Cuando el proveedor no está disponible, el sitio lo indica y nunca inventa un resultado.",
    club: "Club", previewTable: "Clasificación de vista previa. La clasificación en directo aparece aquí cuando se configura un proveedor con clasificaciones.",
    noTable: "Aún no hay clasificación de un proveedor",
    noTableSub: "Este deporte figura en el mapa de cobertura editorial, pero no se ha conectado ningún proveedor de clasificaciones con licencia.",
    dataUpdated: "Datos actualizados", jerusalem: "Jerusalén",
    crestNote: "Los escudos identifican a sus clubes. Escudos de vista previa: FootyLogos; escudos de proveedor: el servicio de datos conectado.",
    scoresViews: "Vistas del centro de resultados", filterBySport: "Filtrar el centro de resultados por deporte", chooseCompetition: "Elegir una competición",
  },
};

function eventDate(value: string | null | undefined, locale: LocaleCode) {
  if (!value) return { day: t(locale, "label.tbc"), time: "" };
  const date = new Date(value);
  const bcp = locale === defaultLocale ? "en-GB" : locale;
  return {
    day: new Intl.DateTimeFormat(bcp, {
      timeZone: "Asia/Jerusalem",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date),
    time: new Intl.DateTimeFormat(bcp, {
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
  locale,
}: {
  match: ScoreEvent;
  expanded: boolean;
  onToggle: () => void;
  locale: LocaleCode;
}) {
  const sc = SC[locale] ?? SC[defaultLocale];
  const date = eventDate(match.startTime, locale);
  const isLive = match.status === "LIVE";
  const lineupTitle = match.sport === "Football" ? sc.startingXI : sc.startingLineups;
  return (
    <div className={`match-block${expanded ? " expanded" : ""}`}>
      <button className="match-row" type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={`details-${match.id}`}>
        <div className="match-time">
          <span className={isLive ? "live-chip" : ""}>{isLive ? match.clock || sc.live : match.status === "FT" ? "FT" : date.time}</span>
          <small>{match.status === "SCHEDULED" ? date.day : match.round ?? match.league}</small>
        </div>
        <div className="match-teams">
          <div><TeamCrest name={match.home} logo={match.homeLogo} /><strong>{match.home}</strong><b>{match.homeScore ?? "–"}</b></div>
          <div><TeamCrest name={match.away} logo={match.awayLogo} alternate /><strong>{match.away}</strong><b>{match.awayScore ?? "–"}</b></div>
        </div>
        <div className="match-action">
          <span>{match.round ?? (match.venue ? sc.venueConfirmed : sc.matchCentre)}</span>
          <strong>{expanded ? sc.closeDetails : sc.openMatchCentre} <ArrowIcon size={15} /></strong>
        </div>
      </button>
      {expanded ? (
        <div className="match-details" id={`details-${match.id}`}>
          <section className="match-detail-panel match-facts-panel">
            <span className="detail-label">{sc.matchFacts}</span>
            <h3>{match.status === "FT" ? sc.ftRecord : isLive ? sc.liveRecord : sc.verifiedFixture}</h3>
            <dl>
              <div><dt>{sc.competition}</dt><dd>{match.league}</dd></div>
              <div><dt>{sc.round}</dt><dd>{match.round ?? sc.notSupplied}</dd></div>
              <div><dt>{sc.venue}</dt><dd>{match.venue ?? sc.notSupplied}</dd></div>
              <div><dt>{sc.jerusalemTime}</dt><dd>{match.startTime ? `${date.day} · ${date.time}` : t(locale, "label.tbc")}</dd></div>
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
              <div className="detail-empty"><ClockIcon size={20} /><strong>{sc.notConfirmed}</strong><p>{lineupTitle} {sc.lineupsEmpty}</p></div>
            )}
          </section>

          <section className="match-detail-panel">
            <span className="detail-label">{sc.goalsTimeline}</span>
            {match.incidents?.length ? (
              <ol className="incident-list">{match.incidents.map((incident) => <li key={incident.id}><b>{incident.minute ?? ""}</b><span><strong>{incident.player ?? incident.detail ?? incident.type}</strong><small>{incident.team ?? incident.detail}</small></span></li>)}</ol>
            ) : (
              <div className="detail-empty"><BoltIcon size={20} /><strong>{sc.noTimeline}</strong><p>{sc.noTimelineSub}</p></div>
            )}
          </section>

          <section className="match-detail-panel">
            <span className="detail-label">{sc.teamStats}</span>
            {match.statistics?.length ? (
              <div className="match-stat-list">{match.statistics.map((stat) => <div key={stat.label}><b>{stat.home}</b><span>{stat.label}</span><b>{stat.away}</b></div>)}</div>
            ) : (
              <div className="detail-empty"><TableIcon size={20} /><strong>{sc.statsNotSupplied}</strong><p>{sc.statsNotSuppliedSub}</p></div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function ScoreCentre({ initialData, locale = defaultLocale }: { initialData: ScoreCentreData; locale?: LocaleCode }) {
  const tr = translator(locale);
  const sc = SC[locale] ?? SC[defaultLocale];
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
          <div className="score-page-nav-actions">
            <LanguageSwitcher label={tr("label.language")} />
            <Link href="/" className="back-home"><HomeIcon size={17} /> {tr("label.backToDesk")}</Link>
          </div>
        </div>
        <div className="page-width score-page-title">
          <div>
            <span className="eyebrow inverse">{sc.liveData}</span>
            <h1>{sc.scoresCentre}</h1>
            <p>{sc.scoresIntro}</p>
          </div>
          <div className={`provider-card provider-${data.health}`}>
            <span className="provider-icon">{data.health === "live" ? <CheckIcon /> : <ClockIcon />}</span>
            <div><small>{sc.currentSource}</small><strong>{data.providerLabel}</strong><span>{sc.nextCheck} {countdown}</span></div>
          </div>
        </div>
      </header>

      <main className="page-width score-page-main">
        {data.message ? <div className={`data-notice notice-${data.health}`}><strong>{data.health === "live" ? sc.liveConnected : data.health === "partial" ? sc.schedulesConnected : data.health === "degraded" ? sc.feedFallback : sc.previewMode}</strong><span>{data.message}</span></div> : null}
        <div className="score-tabs" role="tablist" aria-label={sc.scoresViews}>
          <button className={tab === "live" ? "active" : ""} onClick={() => setTab("live")}><span className="tab-live-dot" /> {sc.liveResults} <b>{data.live.length + data.recent.length}</b></button>
          <button className={tab === "fixtures" ? "active" : ""} onClick={() => setTab("fixtures")}><CalendarIcon size={18} /> {tr("label.fixtures")} <b>{data.fixtures.length}</b></button>
          <button className={tab === "tables" ? "active" : ""} onClick={() => setTab("tables")}><TableIcon size={18} /> {tr("label.tables")} <b>{data.tables.length}</b></button>
          <button className="refresh-button" onClick={refresh} disabled={refreshing}>{refreshing ? sc.checking : sc.refreshNow}</button>
        </div>
        <div className="sport-filters" aria-label={sc.filterBySport}>
          {sports.map((sport) => (
            <button key={sport} className={sportFilter === sport ? "active" : ""} onClick={() => setSportFilter(sport)}>
              {sport}
            </button>
          ))}
        </div>
        {leagues.length > 1 ? (
          <div className="league-filters" aria-label={sc.chooseCompetition}>
            <span>{sc.competitionLabel}</span>
            <div>{leagues.map((league) => <button key={league} className={leagueFilter === league ? "active" : ""} onClick={() => setLeagueFilter(league)}>{league === "All" ? sc.allLeagues : league}</button>)}</div>
          </div>
        ) : null}

        {tab !== "tables" ? (
          <div className="matches-layout">
            <div className="match-groups">
              {Object.entries(matchGroups).length ? Object.entries(matchGroups).map(([league, matches]) => (
                <section key={league} className="match-group">
                  <div className="match-group-heading"><div><span className="competition-mark">{matches[0]?.leagueBadge ? <TeamCrest name={league} logo={matches[0].leagueBadge} /> : <TrophyIcon size={17} />}</span><div><small>{matches[0]?.sport}</small><h2>{league}</h2></div></div><span>{matches.length} {matches.length === 1 ? sc.match : sc.matches}</span></div>
                  {matches.map((match) => <MatchRow key={match.id} match={match} expanded={expandedMatch === match.id} onToggle={() => setExpandedMatch((current) => current === match.id ? null : match.id)} locale={locale} />)}
                </section>
              )) : (
                <div className="no-live-card"><span className="radar-visual"><i /><i /><b /></span><h2>{sc.noLive}</h2><p>{sc.noLiveSub}</p><button onClick={() => setTab("fixtures")}>{sc.viewFixtures} <ArrowIcon size={17} /></button></div>
              )}
            </div>
            <aside className="score-sidebar">
              <div className="score-sidebar-card"><span className="eyebrow">{sc.coverageMap}</span><h3>{sc.wholeSystem}</h3><div className="coverage-list">{data.coverage.map((item) => <div key={item.sport}><strong>{item.sport}</strong><span>{item.competitions.join(" · ")}</span><small>{item.liveScores ? sc.liveScoresConnected : sc.awaitingFeed}{item.standings ? sc.tablesConnected : ""}</small></div>)}</div><p>{sc.coverageNote}</p></div>
              <div className="score-sidebar-card dark-card"><span className="eyebrow inverse">{sc.dataPolicy}</span><h3>{sc.dataPolicyTitle}</h3><p>{sc.dataPolicySub}</p></div>
            </aside>
          </div>
        ) : (
          <div className="tables-layout">
            {visibleTables.map((table) => (
              <section key={table.id} className="league-table-card">
                <div className="league-table-head"><div><span className="competition-mark"><TrophyIcon size={18} /></span><div><small>{table.season}</small><h2>{table.name}</h2></div></div><span>{sc.jerusalemTime}</span></div>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Pos</th><th>{sc.club}</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
                    <tbody>{table.rows.map((row) => <tr key={row.team}><td><span className={`position position-${row.position}`}>{row.position}</span></td><td><TeamCrest name={row.team} logo={row.logo} /><strong>{row.team}</strong></td><td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td><td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td><td><b>{row.points}</b></td></tr>)}</tbody>
                  </table>
                </div>
                {data.provider === "demo" ? <p className="table-preview-note">{sc.previewTable}</p> : null}
              </section>
            ))}
            {!visibleTables.length ? <div className="no-live-card"><h2>{sc.noTable}</h2><p>{sc.noTableSub}</p></div> : null}
          </div>
        )}
      </main>
      <footer className="score-page-footer"><div className="page-width"><span>{sc.dataUpdated} {new Intl.DateTimeFormat(locale === defaultLocale ? "en-GB" : locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jerusalem" }).format(new Date(data.updatedAt))} {sc.jerusalem}</span><span>{sc.crestNote}</span></div></footer>
    </div>
  );
}
