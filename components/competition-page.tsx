import { ArrowIcon, HomeIcon, TableIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedLink as Link } from "@/components/localized-link";
import { TeamCrest } from "@/components/team-crest";
import { t, translator } from "@/lib/i18n/ui";
import type { Competition } from "@/lib/competitions";
import { defaultLocale, type LocaleCode } from "@/lib/locales";
import type { ScoreEvent } from "@/lib/sports-data";

type CompetitionLink = { slug: string; name: string; sport: string };

function kickoff(value: string | null | undefined, locale: LocaleCode) {
  if (!value) return t(locale, "label.tbc");
  return new Intl.DateTimeFormat(locale === defaultLocale ? "en-GB" : locale, {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function MatchRow({ event, locale }: { event: ScoreEvent; locale: LocaleCode }) {
  const isLive = event.status === "LIVE";
  const isFt = event.status === "FT";
  const home = event.homeScore ?? null;
  const away = event.awayScore ?? null;
  const settled = isFt && home !== null && away !== null;
  const homeWin = settled && home > away;
  const awayWin = settled && away > home;
  const status = isLive ? { cls: "live", text: event.clock || "LIVE" } : isFt ? { cls: "ft", text: event.clock ?? "FT" } : { cls: "up", text: kickoff(event.startTime, locale) };

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
  locale = defaultLocale,
}: {
  competition: Competition;
  competitions?: CompetitionLink[];
  activeSlug?: string;
  locale?: LocaleCode;
}) {
  const tr = translator(locale);
  const { name, sport, season, live, upcoming, recent, table, articles } = competition;
  const current = activeSlug ?? competition.slug;
  const matches = [...live, ...upcoming, ...recent].slice(0, 12);
  // Neat monogram from the competition name (e.g. "Israeli Premier League" -> "IPL").
  const leagueBadge = matches[0]?.leagueBadge;
  const badge = name.split(/\s+/).map((w) => w[0]).filter((c) => /[A-Za-z0-9]/.test(c)).join("").slice(0, 3).toUpperCase() || sport.slice(0, 2).toUpperCase() || "•";

  return (
    <div className="competition-page">
      <header className="comp-hero">
        <div className="page-width">
          <div className="comp-hero-nav">
            <Link href="/scores" className="comp-crumb">{sport || tr("label.sport")} · {tr("nav.israel")}</Link>
            <div className="comp-hero-nav-actions">
              <LanguageSwitcher label={tr("label.language")} />
              <Link href="/" className="comp-back"><HomeIcon size={16} /> {tr("nav.home")}</Link>
            </div>
          </div>
          <div className="comp-hero-title">
            <span className="comp-hero-badge">{leagueBadge ? <TeamCrest name={name} logo={leagueBadge} /> : badge}</span>
            <div>
              <h1>{name}</h1>
              {season ? <p className="comp-hero-sub">{season}</p> : null}
            </div>
          </div>
          {competitions.length > 1 ? (
            <nav className="comp-switch" aria-label={tr("aria.switchCompetition")}>
              {competitions.map((c) => (
                <Link key={c.slug} href={`/competition/${c.slug}`} className={c.slug === current ? "on" : ""}>{c.name}</Link>
              ))}
            </nav>
          ) : null}
          <nav className="comp-hero-tabs" aria-label={tr("aria.competitionSections")}>
            <a className="on" href="#overview">{tr("comp.overview")}</a>
            <a href="#matches">{tr("comp.matches")}</a>
            <a href="#standings">{tr("comp.standings")}</a>
            <a href="#stats">{tr("comp.stats")}</a>
          </nav>
        </div>
      </header>

      <main className="page-width comp-layout" id="overview">
        <div className="comp-main">
          <div className="hero-heading" id="matches"><span className="hero-heading-bar" /><h2>{tr("label.liveUpcoming")}</h2></div>
          {matches.length ? (
            <div className="card comp-matches">{matches.map((e) => <MatchRow key={e.id} event={e} locale={locale} />)}</div>
          ) : (
            <div className="card comp-empty"><TableIcon size={22} /><strong>{tr("comp.noMatches")}</strong><span>{tr("comp.noMatchesSub")}</span></div>
          )}

          {articles.length ? (
            <>
              <div className="hero-heading"><span className="hero-heading-bar" /><h2>{tr("comp.latestFrom")}</h2></div>
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
          <div className="hero-heading"><span className="hero-heading-bar" /><h2>{tr("comp.standings")}</h2></div>
          {table.length ? (
            <div className="card comp-table">
              <div className="ctable-head"><span>#</span><span>{tr("comp.team")}</span><span>P</span><span>GD</span><span>Pts</span></div>
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
            <div className="card comp-empty"><strong>{tr("comp.tableUnavailable")}</strong><span>{tr("comp.tableUnavailableSub")}</span></div>
          )}
        </aside>
      </main>

      <section className="page-width comp-stats" id="stats">
        <div className="hero-heading"><span className="hero-heading-bar" /><h2>{tr("comp.seasonStats")}</h2></div>
        <div className="comp-stats-grid">
          <div className="card comp-empty tall"><strong>{tr("comp.topScorers")}</strong><span>{tr("comp.topScorersSub")}</span></div>
          <div className="card comp-empty tall"><strong>{tr("comp.assists")}</strong><span>{tr("comp.assistsSub")}</span></div>
          <div className="card comp-empty tall"><strong>{tr("comp.records")}</strong><span>{tr("comp.recordsSub")}</span></div>
        </div>
      </section>
    </div>
  );
}
