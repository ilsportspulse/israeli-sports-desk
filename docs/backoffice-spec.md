# ILSP Backoffice — complete to-do / specification

Guiding rule: **nothing hardcoded** — everything the public site, apps, AI newsroom and feeds use must be editable from the backoffice. Founder stays anonymous on all public surfaces.

Legend: **[P1]** launch-critical · **[P2]** shortly after · **[P3]** later/scale.

> **Threat model:** an Israel-linked sports news site is a guaranteed target — expect DDoS, defacement attempts, credential-stuffing, scraping and bot abuse. Security and backups are treated as **P1 foundation**, not an add-on.

---

## 0. Security, backups & resilience (P1 — elevated threat model)

### Why the architecture already helps
- The **public site is static/SSR on Vercel's global edge CDN** — there is no origin database or server to hack for the public surface, and content is served from many edge nodes. This alone defeats most defacement/DDoS attempts on the reading experience.
- **All content lives in git** — every change is an immutable, timestamped version. Defacement or a bad edit is undone with a one-click revert + redeploy (minutes), and history can never be silently rewritten.

### Edge protection [P1]
- **Put Cloudflare in front** (proxy mode) of the domain: WAF managed rules, **DDoS mitigation**, rate limiting, bot-fight mode, "**Under Attack**" mode toggle, geo/ASN rules, challenge suspicious traffic. (Note: DNS currently points straight to Vercel; recommended change = domain on Cloudflare → Cloudflare → Vercel.)
- Force **HTTPS + HSTS**; strict **security headers** (CSP, X-Frame-Options/DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Hide origin (Vercel URL) behind Cloudflare so attackers can't bypass the WAF.

### Backoffice hardening [P1]
- **Mandatory 2FA** for admin, strong-password policy, **login rate-limiting + lockout**, optional **IP allowlist**, short session TTL, CSRF protection, secure/HttpOnly/SameSite cookies.
- Admin behind Cloudflare Access / extra gate; non-guessable paths; full **audit log**.
- Principle of least privilege via roles; no secret ever reaches the browser.

### Secrets & supply chain [P1]
- Secrets only as encrypted env vars (Vercel/GitHub secrets), **never in the repo**; rotate tokens periodically; scoped tokens only.
- Dependency scanning (`npm audit`/Dependabot), pinned versions, review third-party scripts (CSP blocks unknown origins).

### Backups — many, layered [P1]
- **Git history** = continuous versioned backup of all content + code (primary).
- **Off-site mirror**: automatic push of the repo to a **second remote** (e.g. GitLab/Codeberg/private) so a GitHub compromise ≠ data loss.
- **Scheduled export** (daily): articles JSON, media manifest, settings → separate encrypted object storage, retained 30–90 days.
- **Media**: images backed up (git and/or object storage with versioning) off-site.
- **Database** (once added): automated snapshots + point-in-time recovery + off-site copy.
- **Documented + tested disaster-recovery runbook**: restore = redeploy from git → live in minutes.

### Monitoring & response [P2]
- Uptime + anomaly alerts, error tracking (Sentry), Cloudflare traffic analytics, log retention.
- Incident playbook: enable Under-Attack mode, revert to last good deploy, rotate keys.

### Resilience [P1]
- CDN keeps serving the **last good deploy** even if a build fails or the origin is unreachable.
- **Instant rollback** to any previous deployment/commit.
- Global edge = no single point of failure.

---

## 1. Access, users & security
- **[P1]** Login (password), signed session, logout, "remember me".
- **[P1]** Route protection for all `/admin` pages + admin APIs.
- **[P2]** Roles & permissions: Admin / Editor / Contributor / Read-only.
- **[P2]** 2FA (authenticator app).
- **[P2]** Audit log — who changed what, when (every create/edit/delete/publish).
- **[P3]** Multiple users, invite flow, per-user activity.
- **[P1]** Secrets handled server-side only (never exposed to the browser).

## 2. Articles (core content)
- **[P1]** List all articles with filters (status, desk, category, date, search).
- **[P1]** Create / edit / delete / **duplicate** an article.
- **[P1]** Full field editor: title, dek, category, desk, kind, storyForm, status, publishedAt/updatedAt, readMinutes, homepagePriority, trending, featured, theme.
- **[P1]** Body editor (paragraph blocks), facts list, quotes.
- **[P1]** Verification sources, nameChecks, AI disclosure, source (name/url/originalTitle/author).
- **[P1]** **Review queue** — publish / reject / edit (manual override even when AI auto-publishes).
- **[P1]** Slug editor with **auto-301-redirect** when a slug changes.
- **[P2]** Match / basketball **recap builder** (lineups 11v11, events timeline, stats, quarters, officials, venue).
- **[P2]** Scheduling (publish at a future time), embargo, expiry.
- **[P2]** **Revision history** + one-click rollback.
- **[P2]** Bulk actions (publish, delete, recategorise, tag).
- **[P2]** Duplicate / dedupe detection (by id, slug, dedupeKey).
- **[P3]** Related-articles / internal-link suggestions.
- **[P3]** Preview-as-published (draft preview URL).

## 3. Media library
- **[P1]** Central asset library: search, reuse, per-image alt / caption / credit / license / creditUrl.
- **[P1]** **Unique-creditUrl enforcement** + forbidden-caption guard.
- **[P1]** Upload + Wikimedia Commons search integration; store width/height.
- **[P1]** **Face-aware crop** (portrait detection, focal point) + visual preview.
- **[P2]** Bulk re-credit, orphaned-asset cleanup, license expiry flags.

## 4. SEO (must be perfect + indexable + AI-search ready)
- **[P1]** `sitemap.xml` (all published articles + pages, lastmod), `robots.txt`, canonical host = ilsportspulse.com.
- **[P1]** Per-page structured data: **NewsArticle**, Organization, WebSite+SearchAction, BreadcrumbList.
- **[P1]** Per-article SEO overrides: meta title, meta description, canonical, OG/Twitter image, keywords, focus keyword.
- **[P1]** Global SEO defaults + templates (title patterns per section).
- **[P1]** OpenGraph + Twitter card + per-article social preview.
- **[P1]** **Redirects manager** (301/302), canonical management, no accidental noindex.
- **[P1]** **AI-search optimisation**: `llms.txt`, clean semantic HTML, factual answers with cited sources (E-E-A-T), RSS/News feed for AI ingestion.
- **[P2]** Google News feed + Google Search Console + Bing/IndexNow **auto-ping on publish**.
- **[P2]** Per-article SEO/readability **score** (checklist: title length, meta, headings, alt text, internal links).
- **[P2]** Core Web Vitals monitoring + performance budget.
- **[P2]** hreflang (ties into translations), pagination canonicals.
- **[P3]** Schema for FAQ / HowTo / SportsEvent where relevant.

## 5. Taxonomy & site structure
- **[P1]** Manage categories, desks, tags (create, rename, order, importance).
- **[P1]** Homepage / section **ordering**, featured slots, pinning, "Israeli/International" tabs.
- **[P1]** Navigation / menu editor.
- **[P2]** Score-centre config: competition allowlist, per-sport ordering, "Israeli-related only" filter, feed provider + poll interval + request budget.
- **[P2]** Manual score / match-centre override; standings tables editor.

## 6. Affiliation & monetisation
- **[P2]** Affiliate links manager (partners, tracking params, auto-disclosure).
- **[P2]** Ad slots / placements config (positions, house ads, sponsors).
- **[P2]** Sponsored-content flagging + mandatory disclosure label.
- **[P2]** Betting/odds affiliate **compliance** (age-gate, geo-restriction, responsible-gambling notice).
- **[P3]** Affiliate performance (clicks, conversions, revenue by partner/article).

## 7. Translations / i18n
- **[P2]** Locale management (add/remove languages), default locale = English.
- **[P2]** Per-article translation workflow (source → translated → status), machine + human review.
- **[P2]** UI-string / market-name / category-name translations.
- **[P2]** hreflang + per-locale sitemaps + canonical linking.
- **[P3]** Auto-translate-on-publish option with review gate.

## 8. Apps & notifications (future iOS/Android)
- **[P2]** Push-notification composer: title/body, per-platform (iOS/Android), deep link, image.
- **[P2]** Segments / topics (breaking, football, basketball, per-team follows), scheduling.
- **[P2]** Notification templates + breaking-news one-click alert.
- **[P2]** App config surface: feed contracts, **feature flags**, min-version gating, kill-switch for scores/notifications.
- **[P3]** Notification analytics (delivery, open rate), A/B.

## 9. AI newsroom automation (cloud, autonomous)
- **[P1]** Automation config: schedule, sources, on/off.
- **[P1]** **Gate settings** editable: FT-rule (≥2 explicit FT sources), confidence threshold, namecheck threshold, "hold-on-any-doubt".
- **[P1]** Monitoring dashboard: what was auto-published / held / skipped, with confidence + reasons.
- **[P2]** Cost / API-usage tracking + budget cap per cycle.
- **[P2]** Manual trigger / pause / re-run; per-source health.
- **[P2]** Correction loop: flag a live article → AI re-verifies → auto-corrects with a visible correction note.

## 10. Distribution
- **[P2]** Social auto-post (X, others) with scheduling + optional approval.
- **[P2]** Newsletter / email campaigns (build, send, metrics).
- **[P1]** RSS / Atom + Google News feed.
- **[P3]** Syndication partners / webhooks.

## 11. Analytics & insights (internal, privacy-first — data stays ours)
- **[P1]** **Internal analytics engine** — self-hosted, no third party receiving the data (no Google Analytics sharing). GDPR-friendly, cookieless option, IP anonymisation.
- **[P1]** **Who views what**: page/article views, unique vs returning visitors, sessions, time-on-page, scroll depth, per-article performance & trending.
- **[P1]** **Where they come from**: referrer breakdown (direct / search / social / referral), search engine + query where available, **UTM campaign tracking**, top external referrers.
- **[P1]** **Geo & device**: country / region / city, device type, OS, browser, language.
- **[P1]** **Live "who's on the site now"** realtime view (current visitors, pages, sources).
- **[P2]** On-site search queries, entry/exit pages, funnels, retention cohorts.
- **[P2]** Score-centre & app engagement (which competitions/matches, notification opens).
- **[P2]** SEO layer: index status, rankings, impressions/clicks (Search Console) alongside internal data.
- **[P2]** Bot/attack traffic separated from real readers (ties into Cloudflare + security).
- **[P2]** Export / scheduled reports; per-article "insights" panel inside the editor.
- **[P3]** Alerting on traffic spikes (viral piece or attack), A/B testing.

## 12. Editorial compliance & policy
- **[P1]** Corrections workflow + public corrections log.
- **[P1]** AI-disclosure config; **founder-anonymity guard** (block personal-info leaks on publish).
- **[P1]** Editorial gate: never publish invented facts/scores; publisher-name rules per desk.
- **[P2]** GDPR / cookie-consent config; privacy / terms / about page editor.

## 14. Community & social layer (be *super original*)
User accounts + interaction — the differentiator. Front-end features + backoffice moderation/management.

### Accounts & profiles [P2]
- Register/login (email + social), profile, avatar, **favourite teams/athletes** (personalises feed + notifications).
- Reputation/level, badges, verified-fan status.

### Comments & discussion [P2]
- Threaded comments on articles with reactions/upvotes; sort by top/new.
- @mentions, follow users, notifications; optional DMs [P3].
- Real-time updates.

### Original score-centre community features [P2/P3] — the standout ideas
- **Live Match Pulse**: a realtime reaction feed per live match — fans drop emoji/short reactions tied to actual match events (goal, red card), producing a live "crowd" energy graph alongside the verified timeline.
- **Predict-the-score**: lock a prediction before kickoff → live leaderboard + season-long **prediction league** with badges.
- **Community Man of the Match** live voting; **fan-sentiment meter** per team.
- **Watch-along rooms**: per-match live chat rooms (moderated), auto-created for Israeli fixtures.
- **Co-commentary**: fans add colour while ILSP supplies the verified facts — clearly separated (fan takes vs verified).
- **Fan zones** per club/community; polls, debates, weekly quiz tie-in.
- All community activity feeds the internal analytics (engagement, retention).

### Moderation & safety [P1 for any launch of UGC — non-negotiable]
- **AI + human moderation**: auto-filter hate speech, incitement, spam, doxxing; queue for review; per-language (EN/HE/AR).
- Report/block, rate-limiting, new-account throttling, **anti-brigade / raid detection** (given the elevated threat model).
- Shadow-ban, ban, IP/device bans; full moderator audit log; appeal flow.
- Identity/abuse controls: email verification, optional phone, no PII exposure, GDPR-compliant user data + deletion.
- Legal guardrails: defamation/hate-speech handling, clear community rules, takedown process.
- Backoffice: moderation dashboard, user management, roles for moderators, banned-word/rules config, all **editable from the BO** (nothing hardcoded).

## 13. System & settings
- **[P1]** Branding editable from BO: logo, colours, fonts, tagline, favicon.
- **[P1]** Deploy status + **cache purge / revalidate** button.
- **[P2]** Backups + export/import (articles, media, settings).
- **[P2]** Domain / email / DNS reference panel; env & integration keys (safe, masked).
- **[P3]** Health checks, error/Sentry feed, uptime.

---

## Architecture notes

### Extensible platform principle (build for what's next)
The system is built as a **modular platform**, not a fixed site — new capabilities plug in without rebuilding the core:
- **Feature modules** (comments, predictions, quizzes, games, **fantasy/manager game**, live match rooms, polls) register into a shared shell (auth, users, notifications, analytics, moderation, data feeds) via clean interfaces.
- Everything **configurable from the backoffice** (enable/disable modules, per-module settings) — nothing hardcoded.
- Shared building blocks reused by every module: user identity, points/badges/leaderboards, realtime channels, notifications, moderation, and the score/data layer — so a **manager game**, a **quiz** or a **prediction league** are new modules on the same rails, not separate apps.
- API-first + versioned contracts so the web app, future iOS/Android apps and third parties consume the same data.

- **Storage**: articles/media/settings persist by committing to the GitHub repo (single source of truth) → Vercel redeploys; move hot/edit-heavy data (settings, notifications, analytics) to a database (Vercel Postgres/KV) as volume grows.
- **Auth**: password + session now; roles + 2FA next.
- **Automation**: scheduled GitHub Action calling the Anthropic API runs the newsroom fully in the cloud (no local machine); the backoffice is its control + monitoring plane, not a manual approval queue.
- **SEO-first**: sitemap/robots/structured-data/feeds ship in P1 so Google + AI engines index from day one; canonical always ilsportspulse.com.

## Suggested build order
1. **P1 SEO foundation** (sitemap, robots, structured data, feeds, canonical, llms.txt) — makes the live site rank/index immediately.
2. **P1 Backoffice core** (auth + article list + review queue publish/reject/edit + media + slug/redirects + corrections + branding).
3. **Cloud AI automation** (GitHub Action + Anthropic key + gate config + monitoring).
4. **P2 modules** (SEO scoring/Search Console, affiliation, translations, notifications/app config, distribution, analytics).
5. **P3 scale** (multi-user, DB migration, advanced analytics, syndication).
