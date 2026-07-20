"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BrandLockup, BrandMark } from "@/components/brand";
import { siteConfig } from "@/config/site";
import {
  ArrowIcon,
  BoltIcon,
  CalendarIcon,
  CloseIcon,
  HomeIcon,
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  TableIcon,
  TrophyIcon,
} from "@/components/icons";
import { DailyQuiz } from "@/components/daily-quiz";
import { MatchScoreline } from "@/components/match-scoreline";
import { BasketballScoreline } from "@/components/basketball-scoreline";
import { StoryVisual } from "@/components/story-visual";
import { TeamCrest } from "@/components/team-crest";
import { formatArticleDate } from "@/lib/articles";
import { getArticleImage } from "@/lib/media";
import { getBasketballWinnerStyle, getWinnerStyle } from "@/lib/match-style";
import type { DailyQuiz as DailyQuizData } from "@/lib/quiz";
import { competitionPriority } from "@/lib/competition-priority";
import type { ScoreCentreData, ScoreEvent } from "@/lib/sports-data";
import type { PublicArticleSummary } from "@/lib/types";

type NewsroomProps = {
  articles: PublicArticleSummary[];
  scores: ScoreCentreData;
  quiz: DailyQuizData;
};

const mainNav = [
  { label: "Home", href: "/" },
  { label: "All stories", href: "/stories" },
  { label: "Israeli football", href: "/#latest" },
  { label: "Basketball", href: "/#latest" },
  { label: "Israelis abroad", href: "/#latest" },
  { label: "International", href: "/#international" },
  { label: "Archive", href: "/archive" },
  { label: "Columns", href: "/columns" },
  { label: "About", href: "/about" },
];

function formatKickoff(value?: string | null) {
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

function ScoreRailCard({ event }: { event: ScoreEvent }) {
  const isLive = event.status === "LIVE";
  return (
    <Link href={event.articleSlug ? `/article/${event.articleSlug}` : "/scores"} className="score-rail-card">
      <div className="score-rail-meta">
        <span className={isLive ? "live-chip" : "fixture-chip"}>
          {isLive ? event.clock || "Live" : event.status === "FT" ? (event.clock ?? "FT") : formatKickoff(event.startTime)}
        </span>
        <span>{event.round && event.round !== event.league ? event.round.replace("Matchweek ", "MW") : ""}</span>
      </div>
      <div className="score-team-row">
        <TeamCrest name={event.home} logo={event.homeLogo} />
        <strong>{event.home}</strong>
        <b>{event.homeScore ?? "–"}</b>
      </div>
      <div className="score-team-row">
        <TeamCrest name={event.away} logo={event.awayLogo} alternate />
        <strong>{event.away}</strong>
        <b>{event.awayScore ?? "–"}</b>
      </div>
    </Link>
  );
}

function ArticleMeta({ article, inverse = false }: { article: PublicArticleSummary; inverse?: boolean }) {
  const materiallyUpdated = Boolean(article.featured && article.updatedAt && article.updatedAt !== article.publishedAt);
  return (
    <div className={`article-meta${inverse ? " inverse" : ""}`}>
      <span>{materiallyUpdated ? "Updated " : ""}{formatArticleDate(materiallyUpdated ? article.updatedAt! : article.publishedAt, true)}</span>
    </div>
  );
}

export function Newsroom({ articles, scores, quiz }: NewsroomProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDesk, setActiveDesk] = useState<"israeli" | "international">("israeli");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [headlinePaused, setHeadlinePaused] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ilsp-theme") ?? window.localStorage.getItem("ilp-theme");
    const initial = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(initial);
    document.documentElement.dataset.theme = initial ? "dark" : "light";
  }, []);

  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      window.localStorage.setItem("ilsp-theme", next ? "dark" : "light");
      return next;
    });
  }

  const tenHoursAgo = Date.now() - 10 * 60 * 60 * 1000;
  const freshnessTime = (article: PublicArticleSummary) =>
    new Date(article.featured ? article.updatedAt ?? article.publishedAt : article.publishedAt).getTime();
  const leadPool = articles
    .filter((article) => article.kind !== "analysis" && article.category !== "From the Archive" && freshnessTime(article) >= tenHoursAgo)
    .sort((a, b) => {
      const ageA = Math.max(0, (Date.now() - freshnessTime(a)) / 3_600_000);
      const ageB = Math.max(0, (Date.now() - freshnessTime(b)) / 3_600_000);
      const scoreA = (a.homepagePriority ?? 50) + Math.max(0, 10 - ageA) * 2;
      const scoreB = (b.homepagePriority ?? 50) + Math.max(0, 10 - ageB) * 2;
      return scoreB - scoreA || freshnessTime(b) - freshnessTime(a);
    })
    .slice(0, 4);
  const featured = leadPool[headlineIndex % Math.max(leadPool.length, 1)] ?? articles[0];
  const standardStories = articles.filter(
    (article) => article.id !== featured.id && article.kind !== "analysis" && article.category !== "From the Archive",
  );
  const heroSecondary = [
    ...leadPool.filter((article) => article.id !== featured.id),
    ...standardStories.filter((article) => !leadPool.some((lead) => lead.id === article.id)),
  ].slice(0, 2);
  const heroStoryIds = new Set([featured.id, ...heroSecondary.map((article) => article.id)]);

  useEffect(() => {
    if (leadPool.length < 2 || headlinePaused) return;
    const timer = window.setInterval(() => {
      setHeadlineIndex((current) => (current + 1) % leadPool.length);
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [headlinePaused, leadPool.length]);
  const analysisStories = articles
    .filter((article) => article.kind === "analysis")
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const international = articles.filter(
    (article) =>
      (article.desk === "international" || article.desk === "world") &&
      article.kind !== "analysis" &&
      !heroStoryIds.has(article.id),
  );
  const archiveStories = articles.filter((article) => article.category === "From the Archive");
  const archiveFeature = archiveStories[0];
  const categories = [
    "All",
    ...Array.from(
      new Set(
        articles
          .filter(
            (article) =>
              article.kind !== "analysis" &&
              article.category !== "The Name Desk" &&
              article.category !== "From the Archive" &&
              article.desk !== "international" &&
              article.desk !== "world",
          )
          .map((article) => article.category),
      ),
    ),
  ];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatch =
        activeCategory === "All" || article.category === activeCategory;
      const searchMatch =
        !search ||
        `${article.title} ${article.dek} ${article.category}`
          .toLowerCase()
          .includes(search);
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, articles, query]);
  const latestStories = filtered.filter((article) => {
    if (heroStoryIds.has(article.id)) return false;
    const isInternational = article.desk === "international" || article.desk === "world";
    if (activeDesk === "international") {
      return isInternational && article.kind !== "analysis" && article.category !== "From the Archive";
    }
    if (activeCategory === "All" && (isInternational || article.kind === "analysis" || article.category === "From the Archive")) return false;
    if (activeCategory !== "All" && isInternational) return false;
    return true;
  });

  const firstRoundByLeague = new Map<string, string>();
  for (const fixture of scores.fixtures) {
    if (!firstRoundByLeague.has(fixture.league)) {
      firstRoundByLeague.set(fixture.league, fixture.round ?? fixture.startTime?.slice(0, 10) ?? fixture.id);
    }
  }
  const completeNextRounds = scores.fixtures.filter(
    (fixture) => (fixture.round ?? fixture.startTime?.slice(0, 10) ?? fixture.id) === firstRoundByLeague.get(fixture.league),
  );
  const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
  const recentWindow = scores.recent.filter(
    (event) => event.startTime && new Date(event.startTime).getTime() >= tenDaysAgo,
  );
  const railEvents = [...scores.live, ...recentWindow, ...completeNextRounds].slice(0, 24);
  const railGroups: { league: string; sport: string; events: ScoreEvent[] }[] = [];
  for (const event of railEvents) {
    const group = railGroups.find((item) => item.league === event.league);
    if (group) group.events.push(event);
    else railGroups.push({ league: event.league, sport: event.sport, events: [event] });
  }
  railGroups.sort((a, b) => competitionPriority(a.sport, a.league) - competitionPriority(b.sport, b.league));
  const statusRank = (event: ScoreEvent) => (event.status === "LIVE" ? 0 : event.status === "SCHEDULED" ? 1 : 2);
  for (const group of railGroups) {
    group.events.sort((a, b) =>
      statusRank(a) - statusRank(b)
      || new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime(),
    );
  }
  const tickerStories = articles.filter((article) => article.category !== "From the Archive").slice(0, 8);
  const trending = [...articles]
    .filter((article) => article.trending && freshnessTime(article) >= tenHoursAgo)
    .sort((a, b) =>
      (a.trending ?? 99) - (b.trending ?? 99)
      || (b.homepagePriority ?? 50) - (a.homepagePriority ?? 50)
      || freshnessTime(b) - freshnessTime(a),
    )
    .slice(0, 5);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to stories
      </a>
      <header className="site-header">
        <div className="page-width header-main">
          <button
            className="icon-button mobile-menu-button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
          <Link href="/" className="brand-lockup" aria-label={`${siteConfig.name} home`}>
            <BrandLockup />
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {mainNav.map((item, index) => (
              <Link key={item.label} href={item.href} className={index === 0 ? "active" : ""}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <SearchIcon />
            </button>
            <button className="icon-button theme-button" aria-label="Toggle colour theme" onClick={toggleTheme}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link href="/scores" className="scores-button">
              <span className="pulse-dot" /> Scores
            </Link>
          </div>
        </div>
        <div className="news-ticker">
          <div className="page-width ticker-inner">
            <strong>
              <BoltIcon size={15} /> Latest
            </strong>
            <div className="ticker-window" role="region" aria-label="Latest headlines">
              <div className="ticker-track">
              {[...tickerStories, ...tickerStories].map((article, index) => (
                <Link
                  key={`${article.id}-${index}`}
                  href={`/article/${article.slug}`}
                  aria-hidden={index >= tickerStories.length ? true : undefined}
                  tabIndex={index >= tickerStories.length ? -1 : undefined}
                >
                  {article.title}
                </Link>
              ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()} aria-label="Mobile menu">
            <div className="drawer-heading">
              <BrandMark small />
              <button className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <nav>
              {mainNav.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label} <ArrowIcon size={18} />
                </Link>
              ))}
              <Link href="/scores" onClick={() => setMenuOpen(false)}>
                Scores, fixtures & tables <ArrowIcon size={18} />
              </Link>
            </nav>
            <p>{siteConfig.description}</p>
          </aside>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="search-layer" role="dialog" aria-modal="true" aria-label="Search stories">
          <div className="search-panel">
            <div className="search-panel-head">
              <div>
                <span>Search the desk</span>
                <h2>What are you following?</h2>
              </div>
              <button className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <label className="search-field">
              <SearchIcon />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Team, player or competition…" />
            </label>
            <div className="search-results">
              {(query ? filtered : articles.slice(0, 5)).slice(0, 8).map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} onClick={() => setSearchOpen(false)}>
                  <span>{article.category}</span>
                  <strong>{article.title}</strong>
                  <ArrowIcon size={18} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <section className="score-rail-section" aria-label="Scores and fixtures">
        <div className="page-width score-rail-head">
          <div>
            <span className="eyebrow">Match centre</span>
            <strong>{scores.live.length ? `${scores.live.length} live now` : `${completeNextRounds.length} upcoming fixtures`}</strong>
          </div>
          <Link href="/scores">
            All scores, fixtures & tables <ArrowIcon size={16} />
          </Link>
        </div>
        <div className="page-width score-rail-scroll">
          {railGroups.length ? (
            railGroups.map((group) => (
              <div key={group.league} className="score-rail-group">
                <span className="score-rail-league">{group.league}</span>
                <div className="score-rail-group-cards">
                  {group.events.map((event) => <ScoreRailCard key={event.id} event={event} />)}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-rail">No matches are live right now. Browse the upcoming fixtures.</div>
          )}
          <Link href="/scores" className="score-rail-more">
            <span><TableIcon /></span>
            <strong>Tables & fixtures</strong>
            <small>Israeli and major international competitions</small>
          </Link>
        </div>
      </section>

      <main id="main-content">
        <section className="page-width hero-section">
          <div className="lead-story-shell" onMouseEnter={() => setHeadlinePaused(true)} onMouseLeave={() => setHeadlinePaused(false)}>
            <Link key={featured.id} href={`/article/${featured.slug}`} className="lead-story">
              <StoryVisual theme={featured.theme} label={featured.category} image={getArticleImage(featured)} priority />
              {featured.matchRecap ? <MatchScoreline recap={featured.matchRecap} variant="lead" /> : null}
              {featured.basketballRecap ? <BasketballScoreline recap={featured.basketballRecap} variant="lead" /> : null}
              <div className="lead-story-copy" aria-live="polite">
                <span className="story-kicker">Top story {headlineIndex % Math.max(leadPool.length, 1) + 1} of {Math.max(leadPool.length, 1)}</span>
                <h1 className={featured.matchRecap || featured.basketballRecap ? "winner-headline" : undefined} style={featured.matchRecap ? getWinnerStyle(featured.matchRecap) : featured.basketballRecap ? getBasketballWinnerStyle(featured.basketballRecap) : undefined}>{featured.title}</h1>
                <p>{featured.dek}</p>
                <ArticleMeta article={featured} inverse />
              </div>
            </Link>
            {leadPool.length > 1 ? (
              <div className="headline-switcher" aria-label="Choose top story">
                {leadPool.map((article, index) => (
                  <button
                    key={article.id}
                    type="button"
                    className={index === headlineIndex % leadPool.length ? "active" : ""}
                    aria-label={`Show headline ${index + 1}: ${article.title}`}
                    onClick={() => setHeadlineIndex(index)}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <div className="hero-stack">
            {heroSecondary.map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`} className="stack-story">
                <StoryVisual theme={article.theme} label={article.category} image={getArticleImage(article)} />
                <div>
                  <span className="story-kicker neutral">{article.category}</span>
                  <h2>{article.title}</h2>
                  <ArticleMeta article={article} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="page-width desk-tabs-row" aria-label="Choose desk">
          <div className="desk-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeDesk === "israeli"}
              className={activeDesk === "israeli" ? "active" : ""}
              onClick={() => { setActiveDesk("israeli"); setActiveCategory("All"); }}
            >
              Israeli sport
            </button>
            <button
              role="tab"
              aria-selected={activeDesk === "international"}
              className={activeDesk === "international" ? "active" : ""}
              onClick={() => { setActiveDesk("international"); setActiveCategory("All"); }}
            >
              International
            </button>
          </div>
        </section>

        {activeDesk === "israeli" ? (
        <section className="page-width filter-row" aria-label="Filter stories">
          <div className="filter-scroll">
            {categories.map((category) => (
              <button
                key={category}
                className={category === activeCategory ? "active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </section>
        ) : null}

        <section className="page-width content-grid" id="latest">
          <div>
            <div className="section-heading">
              <div>
                <span className="eyebrow">The latest</span>
                <h2>{activeDesk === "international" ? "The world\u2019s biggest games" : activeCategory === "All" ? "Across Israeli sport" : activeCategory}</h2>
              </div>
              <div className="section-heading-actions">
                <span className="section-count">{latestStories.length} stories</span>
                <Link href="/stories" className="section-index-link">Browse every story <ArrowIcon size={16} /></Link>
              </div>
            </div>
            <div className="latest-list">
              {latestStories
                .slice(0, 18)
                .map((article) => (
                  <Link key={article.id} href={`/article/${article.slug}`} className="latest-story">
                    <StoryVisual theme={article.theme} label={article.category} image={getArticleImage(article)} />
                    <div className="latest-story-copy">
                      <div className="latest-story-topline">
                        <span className={`kind-badge kind-${article.kind}`}>
                          {article.category}
                        </span>
                        <span>{article.kind === "analysis" ? "Column" : article.kind}</span>
                      </div>
                      <h3>{article.title}</h3>
                      <p>{article.dek}</p>
                      <ArticleMeta article={article} />
                    </div>
                    <ArrowIcon className="latest-arrow" />
                  </Link>
                ))}
            </div>
          </div>
          <aside className="trending-column">
            <div className="trending-card">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Now</span>
                  <h2>Most followed</h2>
                </div>
              </div>
              <ol>
                {trending.map((article, index) => (
                  <li key={article.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Link href={`/article/${article.slug}`}>
                      <strong>{article.title}</strong>
                      <small>{article.category} · {article.featured && article.updatedAt && article.updatedAt !== article.publishedAt ? "Updated " : ""}{formatArticleDate(article.featured && article.updatedAt ? article.updatedAt : article.publishedAt, true)}</small>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </section>

        {archiveFeature ? (
          <section className="archive-section" id="archive" data-year={archiveFeature.archiveDisplay?.year ?? archiveFeature.archiveDate?.slice(0, 4) ?? "Archive"}>
            <div className="page-width archive-shell">
              <Link href={`/article/${archiveFeature.slug}`} className="archive-visual">
                <StoryVisual theme={archiveFeature.theme} label="From the Archive" image={getArticleImage(archiveFeature)} />
                <div className="archive-score">
                  <span>{archiveFeature.archiveDisplay?.home ?? "The story"}</span>
                  <strong>{archiveFeature.archiveDisplay?.score ?? "Archive"}</strong>
                  <span>{archiveFeature.archiveDisplay?.away ?? "Revisited"}</span>
                </div>
              </Link>
              <div className="archive-copy">
                <span className="eyebrow inverse">One beautiful story every day</span>
                <h2>Some results never stop moving.</h2>
                <p className="archive-date">{archiveFeature.archiveDisplay?.dateLine ?? archiveFeature.archiveDate}</p>
                <h3>{archiveFeature.title}</h3>
                <p>{archiveFeature.dek}</p>
                <div className="archive-copy-links">
                  <Link href={`/article/${archiveFeature.slug}`}>Enter the story <ArrowIcon size={18} /></Link>
                  <Link href="/archive">View the complete archive <ArrowIcon size={18} /></Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {archiveStories.length > 1 ? (
          <section className="page-width archive-history-section" aria-labelledby="previous-archive-heading">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Previous editions</span>
                <h2 id="previous-archive-heading">More days from Israeli sporting history</h2>
              </div>
              <Link href="/archive" className="section-index-link">See every archive story <ArrowIcon size={16} /></Link>
            </div>
            <div className="archive-history-grid">
              {archiveStories.slice(1, 4).map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="archive-history-card">
                  <StoryVisual theme={article.theme} label="From the Archive" image={getArticleImage(article)} />
                  <div>
                    <span>{article.archiveDisplay?.dateLine ?? article.archiveDate}</span>
                    <h3>{article.title}</h3>
                    <p>{article.dek}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="page-width quiz-section-wrap">
          <DailyQuiz quiz={quiz} />
        </div>

        <section className="ai-section" id="columns">
          <div className="page-width">
            <div className="ai-heading">
              <div>
                <span className="ai-orb"><BoltIcon /></span>
                <div>
                  <span className="eyebrow inverse">ILSP Columns</span>
                  <h2>Arguments worth having</h2>
                </div>
              </div>
              <p>Tactical context, sharp arguments and the Israeli angle behind the day’s biggest decisions.</p>
            </div>
            <div className="ai-grid">
              {analysisStories.slice(0, 3).map((article, index) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="ai-story">
                  <span className="ai-index">0{index + 1}</span>
                  <span className="ai-label">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.dek}</p>
                  <span className="ai-read">Read column <ArrowIcon size={17} /></span>
                </Link>
              ))}
            </div>
            <Link href="/columns" className="ai-all-link">View every ILSP column <ArrowIcon size={17} /></Link>
          </div>
        </section>

        <section className="page-width international-section" id="international">
          <div className="section-heading wide-heading">
            <div>
              <span className="eyebrow">International corner</span>
              <h2>The world’s biggest games</h2>
            </div>
            <p>World Cup, NBA, Olympics, tennis, cycling and the stories that stop the sporting world.</p>
          </div>
          <div className="international-grid">
            {international.map((article, index) => (
              <Link key={article.id} href={`/article/${article.slug}`} className={index === 0 ? "world-lead" : "world-card"}>
                <StoryVisual theme={article.theme} label="World stage" image={getArticleImage(article)} priority={index === 0} />
                <div>
                  <span className="story-kicker">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.dek}</p>
                  <ArticleMeta article={article} />
                </div>
              </Link>
            ))}
            <Link href="/scores" className="world-match-centre">
              <span className="world-cup-icon"><TrophyIcon size={28} /></span>
              <span className="eyebrow inverse">World Cup 2026</span>
              <h3>Live bracket, fixtures and scores</h3>
              <p>One clean match centre for the global tournament and Israeli competitions.</p>
              <span>Open match centre <ArrowIcon size={17} /></span>
            </Link>
          </div>
        </section>

        <section className="page-width newsletter-section">
          <div>
            <span className="eyebrow">The morning read</span>
            <h2>Israeli sport, translated into context.</h2>
            <p>A crisp English briefing with the scores, decisive moments and what happens next.</p>
          </div>
          <form onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" type="email" placeholder="you@example.com" />
            <button type="submit">Join the list <ArrowIcon size={17} /></button>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-grid">
          <div>
            <Link href="/" className="brand-lockup footer-brand">
              <BrandLockup />
            </Link>
            <p>{siteConfig.description}</p>
          </div>
          <div>
            <strong>Coverage</strong>
            <Link href="/#latest">Israeli football</Link>
            <Link href="/#latest">Basketball</Link>
            <Link href="/#international">International</Link>
          </div>
          <div>
            <strong>Data</strong>
            <Link href="/scores">Live scores</Link>
            <Link href="/scores?tab=fixtures">Fixtures</Link>
            <Link href="/scores?tab=tables">Tables</Link>
          </div>
          <div>
            <strong>Explore</strong>
            <Link href="/stories">All stories</Link>
            <Link href="/archive">From the Archive</Link>
            <Link href="/columns">Columns</Link>
            <Link href="/article/gloukh-not-gloch-name-desk">Name desk</Link>
            <Link href="/about">Why ILSP exists</Link>
          </div>
        </div>
        <div className="page-width footer-bottom">
          <span>© 2026 {siteConfig.name}.</span>
          <nav aria-label="Editorial and legal policies">
            <Link href="/corrections">Corrections</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/commercial-independence">Commercial independence</Link>
          </nav>
          <span>Israeli sport in English.</span>
        </div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link href="/" className="active"><HomeIcon /><span>Home</span></Link>
        <button onClick={() => setSearchOpen(true)}><SearchIcon /><span>Search</span></button>
        <Link href="/scores"><BoltIcon /><span>Scores</span></Link>
        <Link href="/scores?tab=fixtures"><CalendarIcon /><span>Fixtures</span></Link>
        <Link href="/scores?tab=tables"><TableIcon /><span>Tables</span></Link>
      </nav>
    </div>
  );
}
