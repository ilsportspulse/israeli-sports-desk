"use client";

import { useEffect, useMemo, useState } from "react";

import { LocalizedLink as Link } from "@/components/localized-link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { defaultLocale, type LocaleCode } from "@/lib/locales";
import { t, translator, type UiKey } from "@/lib/i18n/ui";
import { BrandLockup, BrandMark } from "@/components/brand";
import { siteConfig } from "@/config/site";
import {
  ArrowIcon,
  BoltIcon,
  CloseIcon,
  MenuIcon,
  MoonIcon,
  ScoreboardIcon,
  SearchIcon,
  SunIcon,
} from "@/components/icons";
import { DailyQuiz } from "@/components/daily-quiz";
import { StoryVisual } from "@/components/story-visual";
import { TeamCrest } from "@/components/team-crest";
import { formatArticleDate } from "@/lib/articles";
import type { SocialWatchItem } from "@/lib/social-watch";
import { NewsWatchRail } from "@/components/israeli-news-watcher";
import { getArticlePhoto } from "@/lib/media";
import type { DailyQuiz as DailyQuizData } from "@/lib/quiz";
import { competitionPriority } from "@/lib/competition-priority";
import type { ScoreCentreData, ScoreEvent } from "@/lib/sports-data";
import type { PublicArticleSummary } from "@/lib/types";

type NewsroomProps = {
  articles: PublicArticleSummary[];
  scores: ScoreCentreData;
  quiz: DailyQuizData;
  categoryOrder?: string[];
  locale?: LocaleCode;
  socialWatch?: SocialWatchItem[];
};

const mainNav: { key: UiKey; href: string }[] = [
  { key: "nav.home", href: "/" },
  { key: "nav.israeliSport", href: "/#latest" },
  { key: "nav.internationalSport", href: "/#international" },
  { key: "nav.archive", href: "/#archive" },
  { key: "nav.columns", href: "/#columns" },
  { key: "nav.quiz", href: "/#daily-quiz" },
  { key: "nav.about", href: "/about" },
  { key: "nav.partners", href: "/partners" },
];

function formatKickoff(value: string | null | undefined, locale: LocaleCode) {
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

// Compact game block for the thin one-line scores strip at the very top.
const SPORT_ICON: Record<string, string> = { football: "⚽", soccer: "⚽", basketball: "🏀", handball: "🤾", volleyball: "🏐" };

// Short, readable competition label for the card header.
function competitionLabel(event: ScoreEvent): string {
  const l = event.league || "";
  return l
    .replace(/^UEFA\s+/i, "")
    .replace(/Israeli Basketball Premier League/i, "Winner League")
    .replace(/Israeli Premier League/i, "Ligat ha'Al")
    .trim() || event.sport;
}

function ScoreStripItem({ event, locale }: { event: ScoreEvent; locale: LocaleCode }) {
  const isLive = event.status === "LIVE";
  const isFt = event.status === "FT";
  const home = event.homeScore ?? null;
  const away = event.awayScore ?? null;
  const settled = isFt && home !== null && away !== null;
  const homeWon = settled && home !== null && away !== null && home > away;
  const awayWon = settled && home !== null && away !== null && away > home;
  const statusText = isLive ? `LIVE${event.clock ? ` · ${event.clock}` : ""}` : isFt ? "FT" : formatKickoff(event.startTime, locale);
  const statusClass = isLive ? "live" : isFt ? "ft" : "up";
  const icon = SPORT_ICON[(event.sport || "").toLowerCase()] ?? "•";
  return (
    <Link href={event.articleSlug ? `/article/${event.articleSlug}` : "/scores"} className={`sb-game${isLive ? " is-live" : ""}`}>
      <div className="sb-head">
        <span className="sb-comp"><span className="sb-comp-ico" aria-hidden="true">{icon}</span>{competitionLabel(event)}</span>
        <span className={`sb-status ${statusClass}`}>{isLive ? <><span className="sb-live-dot" aria-hidden="true" />{statusText}</> : statusText}</span>
      </div>
      <div className={`sb-team${awayWon ? " lose" : ""}`}>
        <TeamCrest name={event.home} logo={event.homeLogo} />
        <span className="nm">{event.home}</span>
        <span className="sc">{home ?? "–"}</span>
      </div>
      <div className={`sb-team${homeWon ? " lose" : ""}`}>
        <TeamCrest name={event.away} logo={event.awayLogo} alternate />
        <span className="nm">{event.away}</span>
        <span className="sc">{away ?? "–"}</span>
      </div>
    </Link>
  );
}

function ArticleMeta({ article, inverse = false, locale }: { article: PublicArticleSummary; inverse?: boolean; locale: LocaleCode }) {
  const materiallyUpdated = Boolean(article.featured && article.updatedAt && article.updatedAt !== article.publishedAt);
  return (
    <div className={`article-meta${inverse ? " inverse" : ""}`}>
      <span>{materiallyUpdated ? `${t(locale, "label.updated")} ` : ""}{formatArticleDate(materiallyUpdated ? article.updatedAt! : article.publishedAt, true, locale)}</span>
    </div>
  );
}

export function Newsroom({ articles, scores, quiz, categoryOrder, locale = defaultLocale, socialWatch = [] }: NewsroomProps) {
  const tr = translator(locale);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDesk] = useState<"israeli" | "international">("israeli");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);

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
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
  const freshnessTime = (article: PublicArticleSummary) =>
    new Date(article.featured ? article.updatedAt ?? article.publishedAt : article.publishedAt).getTime();
  // The lead/top-stories block is ISRAELI news first — the whole point of an Israeli
  // sports pulse. Only genuinely HUGE international stories (a World Cup final, a Messi
  // retirement) earn a headline slot; everything else international goes to the
  // International corner below. We gate that on a high homepagePriority (>=85).
  const isHeadlineWorthy = (article: PublicArticleSummary) =>
    article.kind !== "analysis" &&
    article.category !== "From the Archive" &&
    (article.desk === "israel" || (article.homepagePriority ?? 50) >= 85);
  // Editorial lead score: news value (the 0-100 editorial scale; legacy values
  // outside it are clamped) + Israeli boost, decaying 2 points/hour after a
  // 6-hour grace. A big result can lead ~1.5 days; a quote can never outlast
  // fresher real news. An editor pin (featured) always wins.
  const leadScore = (article: PublicArticleSummary) => {
    const value = Math.min(100, Math.max(0, article.homepagePriority ?? 50));
    const ageHours = Math.max(0, (Date.now() - freshnessTime(article)) / 3_600_000);
    return (article.featured ? 1000 : 0) + value + (article.desk === "israel" ? 15 : 0) - Math.max(0, ageHours - 6) * 2;
  };
  const leadPool = articles
    .filter((article) => isHeadlineWorthy(article) && (article.featured || freshnessTime(article) >= fortyEightHoursAgo))
    .sort((a, b) => leadScore(b) - leadScore(a) || freshnessTime(b) - freshnessTime(a))
    .slice(0, 4);
  const featured = leadPool[0] ?? articles.find(isHeadlineWorthy) ?? articles.find((a) => a.desk === "israel") ?? articles[0];
  const standardStories = articles.filter((article) => article.id !== featured.id && isHeadlineWorthy(article));
  // Secondary top stories shown as cards beneath the lead.
  const heroRail = [
    ...leadPool.filter((article) => article.id !== featured.id),
    ...standardStories.filter((article) => !leadPool.some((lead) => lead.id === article.id)),
  ].slice(0, 5);
  const heroStoryIds = new Set([featured.id, ...heroRail.map((article) => article.id)]);

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
  const derivedCategories = Array.from(
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
  );
  // Apply the backoffice-defined order when available; unlisted categories keep
  // their natural order at the end.
  if (categoryOrder && categoryOrder.length) {
    const rank = new Map(categoryOrder.map((name, i) => [name, i]));
    derivedCategories.sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
  }
  const categories = ["All", ...derivedCategories];

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
  // Strip = live now + results from the last 24h only + upcoming fixtures.
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentWindow = scores.recent.filter(
    (event) => event.startTime && new Date(event.startTime).getTime() >= twentyFourHoursAgo,
  );
  const railEvents = [...scores.live, ...recentWindow, ...completeNextRounds].slice(0, 24);
  const railGroups: { league: string; sport: string; events: ScoreEvent[] }[] = [];
  for (const event of railEvents) {
    const group = railGroups.find((item) => item.league === event.league);
    if (group) group.events.push(event);
    else railGroups.push({ league: event.league, sport: event.sport, events: [event] });
  }
  // Order the rail like an agenda: whatever is LIVE now first, then the groups
  // with the soonest upcoming match (so today's European ties lead over a
  // domestic round weeks away), with competition priority as the tie-breaker.
  const groupSoonest = (group: { events: ScoreEvent[] }) => {
    const hasLive = group.events.some((e) => e.status === "LIVE");
    const soonest = group.events
      .filter((e) => e.status === "SCHEDULED" && e.startTime)
      .reduce((min, e) => Math.min(min, new Date(e.startTime!).getTime()), Number.POSITIVE_INFINITY);
    return { hasLive, soonest };
  };
  railGroups.sort((a, b) => {
    const ga = groupSoonest(a);
    const gb = groupSoonest(b);
    if (ga.hasLive !== gb.hasLive) return ga.hasLive ? -1 : 1;
    if (ga.soonest !== gb.soonest) return ga.soonest - gb.soonest;
    return competitionPriority(a.sport, a.league) - competitionPriority(b.sport, b.league);
  });
  const statusRank = (event: ScoreEvent) => (event.status === "LIVE" ? 0 : event.status === "SCHEDULED" ? 1 : 2);
  for (const group of railGroups) {
    group.events.sort((a, b) =>
      statusRank(a) - statusRank(b)
      || new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime(),
    );
  }
  const tickerStories = articles.filter((article) => article.category !== "From the Archive").slice(0, 8);
  const byRank = (a: (typeof articles)[number], b: (typeof articles)[number]) =>
    (a.trending ?? 99) - (b.trending ?? 99)
    || (b.homepagePriority ?? 50) - (a.homepagePriority ?? 50)
    || freshnessTime(b) - freshnessTime(a);
  // "Most followed" should never be empty. Prefer fresh trending stories, but
  // fall back to the top trending regardless of age, then to the highest-priority
  // recent stories — so the rail always has five items even during a quiet spell.
  const freshTrending = [...articles]
    .filter((article) => article.trending && freshnessTime(article) >= tenHoursAgo)
    .sort(byRank);
  const anyTrending = [...articles].filter((article) => article.trending).sort(byRank);
  const byPriority = [...articles].sort(
    (a, b) => (b.homepagePriority ?? 50) - (a.homepagePriority ?? 50) || freshnessTime(b) - freshnessTime(a),
  );
  const trendingSeen = new Set<string>();
  const trending = [...freshTrending, ...anyTrending, ...byPriority]
    .filter((article) => (trendingSeen.has(article.id) ? false : trendingSeen.add(article.id)))
    .slice(0, 5);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        {tr("label.skipToStories")}
      </a>
      {railEvents.length ? (
        <div className="score-strip" aria-label={tr("label.liveScores")}>
          <div className="page-width score-strip-inner">
            <span className="sb-label"><span className="status-dot" />{tr("label.liveUpcoming")}</span>
            {railGroups.flatMap((group) => group.events).map((event) => <ScoreStripItem key={event.id} event={event} locale={locale} />)}
            <Link href="/scores" className="sb-more">{tr("nav.scores")} <ArrowIcon size={13} /></Link>
          </div>
        </div>
      ) : null}
      <header className="site-header">
        <div className="page-width header-main">
          <button
            className="icon-button mobile-menu-button"
            aria-label={tr("action.openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
          <Link href="/" className="brand-lockup" aria-label={`${siteConfig.name} — ${tr("nav.home")}`}>
            <BrandLockup />
          </Link>
          <nav className="desktop-nav" aria-label={tr("aria.mainNav")}>
            {mainNav.map((item, index) => (
              <Link key={item.href} href={item.href} className={index === 0 ? "active" : ""}>
                {tr(item.key)}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button className="icon-button" aria-label={tr("action.search")} onClick={() => setSearchOpen(true)}>
              <SearchIcon />
            </button>
            <button className="icon-button theme-button" aria-label={tr("action.toggleTheme")} onClick={toggleTheme}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <LanguageSwitcher label={tr("label.language")} />
            <Link href="/scores" className="scores-button">
              <ScoreboardIcon size={17} /> {tr("nav.matchCenter")}
            </Link>
          </div>
        </div>
        <div className="news-ticker">
          <div className="page-width ticker-inner">
            <strong>
              <BoltIcon size={15} /> {tr("label.latest")}
            </strong>
            <div className="ticker-window" role="region" aria-label={tr("label.latestHeadlines")}>
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
          <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()} aria-label={tr("aria.mobileMenu")}>
            <div className="drawer-heading">
              <BrandMark small />
              <button className="icon-button" aria-label={tr("action.closeMenu")} onClick={() => setMenuOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <nav>
              {mainNav.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  {tr(item.key)} <ArrowIcon size={18} />
                </Link>
              ))}
              <Link href="/scores" onClick={() => setMenuOpen(false)}>
                {tr("nav.scores")} <ArrowIcon size={18} />
              </Link>
            </nav>
            <p>{siteConfig.description}</p>
          </aside>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="search-layer" role="dialog" aria-modal="true" aria-label={tr("aria.searchDialog")}>
          <div className="search-panel">
            <div className="search-panel-head">
              <div>
                <span>{tr("search.eyebrow")}</span>
                <h2>{tr("search.title")}</h2>
              </div>
              <button className="icon-button" aria-label={tr("action.closeSearch")} onClick={() => setSearchOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <label className="search-field">
              <SearchIcon />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("search.placeholder")} />
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

      <main id="main-content">
        <section className="topstories-block" aria-label={tr("section.latest")}>
          <div className="page-width">
            <div className="ts-head">
              <span className="hero-heading-bar" />
              <h2>{tr("section.latest")}</h2>
              <Link href="/stories" className="ts-more">{tr("nav.allStories")} <ArrowIcon size={15} /></Link>
            </div>
            <Link href={`/article/${featured.slug}`} className="ts-lead">
              <div className="ts-lead-img">
                <StoryVisual theme={featured.theme} label={featured.category} image={getArticlePhoto(featured)} priority />
                <span className="ts-cat">{featured.category}</span>
              </div>
              <div className="ts-lead-copy">
                <h1>{featured.title}</h1>
                <p>{featured.dek}</p>
                <ArticleMeta article={featured} inverse locale={locale} />
              </div>
            </Link>
            <div className="ts-cards">
              {heroRail.slice(0, 4).map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="ts-card">
                  <div className="ts-card-img"><StoryVisual theme={article.theme} label={article.category} image={getArticlePhoto(article)} /></div>
                  <span className="ts-card-cat">{article.category}</span>
                  <h3>{article.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>


        {activeDesk === "israeli" ? (
        <section className="page-width filter-row" aria-label={tr("aria.filterStories")}>
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
                <span className="eyebrow">{tr("section.theLatest")}</span>
                <h2>{activeDesk === "international" ? tr("section.biggestGames") : activeCategory === "All" ? tr("section.acrossIsraeliSport") : activeCategory}</h2>
              </div>
              <div className="section-heading-actions">
                <span className="section-count">{latestStories.length} {tr("label.stories")}</span>
                <Link href="/stories" className="section-index-link">{tr("action.browseEvery")} <ArrowIcon size={16} /></Link>
              </div>
            </div>
            <div className="latest-list">
              {latestStories
                .slice(0, 10)
                .map((article) => (
                  <Link key={article.id} href={`/article/${article.slug}`} className="latest-story">
                    <StoryVisual theme={article.theme} label={article.category} image={getArticlePhoto(article)} />
                    <div className="latest-story-copy">
                      <div className="latest-story-topline">
                        <span className={`kind-badge kind-${article.kind}`}>
                          {article.category}
                        </span>
                        <span>{article.kind === "analysis" ? tr("label.column") : article.kind}</span>
                      </div>
                      <h3>{article.title}</h3>
                      <p>{article.dek}</p>
                      <ArticleMeta article={article} locale={locale} />
                    </div>
                    <ArrowIcon className="latest-arrow" />
                  </Link>
                ))}
            </div>
          </div>
          <aside className="trending-column">
            {socialWatch.length ? (
              <NewsWatchRail items={socialWatch} locale={locale} />
            ) : (
              <div className="trending-card">
                <div className="section-heading compact">
                  <div>
                    <span className="eyebrow">{tr("label.now")}</span>
                    <h2>{tr("section.mostFollowed")}</h2>
                  </div>
                </div>
                <ol>
                  {trending.map((article, index) => (
                    <li key={article.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <Link href={`/article/${article.slug}`}>
                        <strong>{article.title}</strong>
                        <small>{article.category} · {article.featured && article.updatedAt && article.updatedAt !== article.publishedAt ? `${tr("label.updated")} ` : ""}{formatArticleDate(article.featured && article.updatedAt ? article.updatedAt : article.publishedAt, true, locale)}</small>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>
        </section>

        {archiveFeature ? (
          <section className="topstories-block retro-block" id="archive" aria-label={tr("nav.archive")}>
            <div className="page-width">
              <div className="ts-head">
                <span className="hero-heading-bar" />
                <h2>{tr("nav.archive")}</h2>
                <Link href="/archive" className="ts-more">{tr("section.allArchive")} <ArrowIcon size={15} /></Link>
              </div>
              <Link href={`/article/${archiveFeature.slug}`} className="ts-lead">
                <div className="ts-lead-img">
                  <StoryVisual theme={archiveFeature.theme} label="Retro" image={getArticlePhoto(archiveFeature)} />
                  <span className="ts-cat">{tr("nav.archive")} · {archiveFeature.archiveDisplay?.dateLine ?? archiveFeature.archiveDate}</span>
                </div>
                <div className="ts-lead-copy">
                  <h1>{archiveFeature.title}</h1>
                  <p>{archiveFeature.dek}</p>
                </div>
              </Link>
              {archiveStories.length > 1 ? (
                <div className="ts-cards">
                  {archiveStories.slice(1, 5).map((article) => (
                    <Link key={article.id} href={`/article/${article.slug}`} className="ts-card">
                      <div className="ts-card-img"><StoryVisual theme={article.theme} label="Retro" image={getArticlePhoto(article)} /></div>
                      <span className="ts-card-cat">{article.archiveDisplay?.dateLine ?? article.archiveDate}</span>
                      <h3>{article.title}</h3>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {international.length ? (
          <section className="topstories-block intl-block light-block" id="international" aria-label={tr("section.intlCorner")}>
            <div className="page-width">
              <div className="ts-head">
                <span className="hero-heading-bar" />
                <h2>{tr("section.intlCorner")}</h2>
                <Link href="/stories" className="ts-more">{tr("nav.allStories")} <ArrowIcon size={15} /></Link>
              </div>
              <Link href={`/article/${international[0].slug}`} className="ts-lead">
                <div className="ts-lead-img">
                  <StoryVisual theme={international[0].theme} label={international[0].category} image={getArticlePhoto(international[0])} />
                  <span className="ts-cat">{international[0].category}</span>
                </div>
                <div className="ts-lead-copy">
                  <h1>{international[0].title}</h1>
                  <p>{international[0].dek}</p>
                  <ArticleMeta article={international[0]} inverse locale={locale} />
                </div>
              </Link>
              {international.length > 1 ? (
                <div className="ts-cards">
                  {international.slice(1, 5).map((article) => (
                    <Link key={article.id} href={`/article/${article.slug}`} className="ts-card">
                      <div className="ts-card-img"><StoryVisual theme={article.theme} label={article.category} image={getArticlePhoto(article)} /></div>
                      <span className="ts-card-cat">{article.category}</span>
                      <h3>{article.title}</h3>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {international.length > 5 ? (
          <section className="page-width intl-latest-section" aria-label={tr("aria.moreInternational")}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">{tr("nav.international")}</span>
                <h2>{tr("section.moreWorld")}</h2>
              </div>
              <Link href="/stories" className="section-index-link">{tr("nav.allStories")} <ArrowIcon size={16} /></Link>
            </div>
            <div className="latest-list">
              {international.slice(5, 15).map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="latest-story">
                  <StoryVisual theme={article.theme} label={article.category} image={getArticlePhoto(article)} />
                  <div className="latest-story-copy">
                    <div className="latest-story-topline">
                      <span className={`kind-badge kind-${article.kind}`}>{article.category}</span>
                      <span>{article.kind === "analysis" ? tr("label.column") : article.kind}</span>
                    </div>
                    <h3>{article.title}</h3>
                    <p>{article.dek}</p>
                    <ArticleMeta article={article} locale={locale} />
                  </div>
                  <ArrowIcon className="latest-arrow" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="ai-section" id="columns">
          <div className="page-width">
            <div className="ai-heading">
              <div>
                <span className="ai-orb"><BoltIcon /></span>
                <div>
                  <span className="eyebrow inverse">{tr("section.ilspColumns")}</span>
                  <h2>{tr("columns.heading")}</h2>
                </div>
              </div>
              <p>{tr("columns.blurb")}</p>
            </div>
            <div className="ai-grid">
              {analysisStories.slice(0, 3).map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="ai-story">
                  <div className="ai-story-img">
                    <StoryVisual theme={article.theme} label={article.category} image={getArticlePhoto(article)} />
                    <span className="ai-story-tag">{tr("label.column")}</span>
                  </div>
                  <div className="ai-story-body">
                    <span className="ai-label">{article.category}</span>
                    <h3>{article.title}</h3>
                    <p>{article.dek}</p>
                    <span className="ai-read">{tr("action.readColumn")} <ArrowIcon size={17} /></span>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/columns" className="ai-all-link">{tr("action.viewAllColumns")} <ArrowIcon size={17} /></Link>
          </div>
        </section>


        <div className="page-width quiz-section-wrap">
          <DailyQuiz quiz={quiz} />
        </div>


        <section className="page-width newsletter-section">
          <div>
            <span className="eyebrow">{tr("newsletter.eyebrow")}</span>
            <h2>{tr("newsletter.title")}</h2>
            <p>{tr("newsletter.blurb")}</p>
          </div>
          <form onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="newsletter-email">{tr("newsletter.emailLabel")}</label>
            <input id="newsletter-email" type="email" placeholder={tr("newsletter.placeholder")} />
            <button type="submit">{tr("newsletter.cta")} <ArrowIcon size={17} /></button>
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
            <strong>{tr("footer.coverage")}</strong>
            <Link href="/#latest">{tr("nav.football")}</Link>
            <Link href="/#latest">{tr("nav.basketball")}</Link>
            <Link href="/#international">{tr("nav.international")}</Link>
          </div>
          <div>
            <strong>{tr("footer.data")}</strong>
            <Link href="/scores">{tr("label.liveScores")}</Link>
            <Link href="/scores?tab=fixtures">{tr("label.fixtures")}</Link>
            <Link href="/scores?tab=tables">{tr("label.tables")}</Link>
          </div>
          <div>
            <strong>{tr("footer.explore")}</strong>
            <Link href="/stories">{tr("nav.allStories")}</Link>
            <Link href="/archive">{tr("label.fromArchive")}</Link>
            <Link href="/columns">{tr("nav.columns")}</Link>
            <Link href="/article/gloukh-not-gloch-name-desk">{tr("footer.nameDesk")}</Link>
            <Link href="/about">{tr("footer.whyIlsp")}</Link>
          </div>
        </div>
        <div className="page-width footer-bottom">
          <span>© 2026 {siteConfig.name}.</span>
          <nav aria-label={tr("aria.legalPolicies")}>
            <Link href="/corrections">{tr("label.corrections")}</Link>
            <Link href="/privacy">{tr("footer.privacy")}</Link>
            <Link href="/terms">{tr("footer.terms")}</Link>
            <Link href="/commercial-independence">{tr("footer.commercial")}</Link>
          </nav>
          <span>{tr("footer.tagline")}</span>
        </div>
      </footer>

    </div>
  );
}
