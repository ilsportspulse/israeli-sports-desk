# ILSP mobile applications and shared API architecture

Status: local architecture decision with football and basketball recap contracts, an exact contract-snapshot gate and a fail-closed evidence-currentness preflight, 17 July 2026  
Visibility: internal  
External gates: Apple/Google developer accounts, production infrastructure, paid services, privacy review and store submission all require owner approval.

## Decision

Build one high-quality React Native application with Expo and TypeScript, shipped as separate iOS and Android products. Keep the website and apps on one editorial data model, but place a versioned ILSP API between the mobile clients and every newsroom or score provider.

This is the best fit for the launch budget. It avoids paying for two largely duplicated native codebases while preserving native navigation, notifications, deep links, accessibility and store-quality interaction. Native Swift or Kotlin modules remain available for a capability that cannot meet the quality bar through Expo. A fully separate SwiftUI and Jetpack Compose build should be reconsidered only when audience, revenue or platform-specific functionality justifies two permanent mobile teams.

## Product boundaries

The first public release includes:

- home, latest, sport and competition feeds;
- article, column and archive reading;
- score centre, fixtures, results and tables for competitions that pass the provider rights and quality gate;
- search, saved stories and followed teams or sports;
- optional breaking-news and followed-topic notifications;
- English at launch, with locale-aware data and right-to-left layout support present from the foundation;
- offline access to the latest downloaded feed and saved stories.

The first release excludes live video, betting, comments, public user profiles, fantasy games and a subscription paywall. Each would add moderation, rights, age, identity or payment obligations that are premature for the first product.

## System shape

```text
Newsroom data + licensed score providers
                    |
             ILSP ingestion layer
                    |
        validated canonical data store
                    |
        /api/v1 mobile and web gateway
          /          |             \
     Website      iOS app       Android app
```

Provider credentials never ship to a browser or mobile binary. The gateway normalises provider-specific identifiers, enforces rights rules, applies caching and exposes the same canonical team, competition, event and article objects to every ILSP product.

## Repository shape

The preferred monorepo layout is:

```text
apps/web                 existing Next.js publication
apps/mobile              Expo Router application
packages/api-contracts   schemas, generated types and fixtures
packages/design-tokens   colour, spacing, type and motion tokens
packages/editorial       public article and navigation models
packages/localisation    locale keys and formatting helpers
```

The existing site can migrate into this structure incrementally. No large directory move is required before the first mobile prototype. Shared packages should first be extracted only where the current application already has a stable contract.

## Public API v1

All responses use UTF-8 JSON, HTTPS, ISO 8601 timestamps with an explicit offset, stable ILSP identifiers and a top-level `schemaVersion`. Dates displayed to users are formatted in the selected locale; event time is stored as an instant and retains the competition venue timezone where useful.

| Endpoint | Purpose | Cache policy |
|---|---|---|
| `GET /api/v1/config` | supported locales, navigation, minimum app version, feature flags | 5 minutes plus ETag |
| `GET /api/v1/home` | server-ranked home modules and their story/event references | 60 seconds plus ETag |
| `GET /api/v1/articles` | cursor-paginated stories filtered by desk, sport, competition, kind or locale | 60 seconds plus ETag |
| `GET /api/v1/articles/{slug}` | one public article with related-story references | 5 minutes plus purge on update |
| `GET /api/v1/search` | bounded article, team, athlete and competition search | short private cache |
| `GET /api/v1/events` | live, scheduled and completed events by window, sport and competition | 15 seconds live; 5 minutes otherwise |
| `GET /api/v1/events/{id}` | score, status, timeline and available statistics | 10–30 seconds while live |
| `GET /api/v1/standings` | league/group table at a provider-confirmed update time | 5 minutes |
| `GET /api/v1/teams/{id}` | canonical team profile, fixtures and related coverage | 5 minutes |
| `GET /api/v1/athletes/{id}` | canonical athlete profile and related coverage where licensed | 5 minutes |
| `POST /api/v1/devices` | register or rotate a notification token and preferences | no shared cache |
| `DELETE /api/v1/devices/{installationId}` | revoke notification delivery for an installation | no shared cache |

List endpoints use opaque cursor pagination. Mobile clients must not infer page numbers or provider IDs. `include` parameters are bounded and documented; unknown fields are ignored so v1 can gain additive fields without breaking older applications.

### Response envelope

```json
{
  "schemaVersion": "1.0",
  "generatedAt": "2026-07-16T06:30:00+03:00",
  "data": [],
  "page": {
    "nextCursor": null
  },
  "meta": {
    "locale": "en",
    "timezone": "Asia/Jerusalem"
  }
}
```

Errors use a stable machine code, a safe user message, a request ID and optional retry information. They never expose provider credentials, internal file paths or editorial review fields.

## Canonical contracts

Every content object has a stable `id`, a public `slug` where relevant, `publishedAt`, `updatedAt`, `locale`, `status` and `schemaVersion`. Only published editorial fields reach the public API. Source maps, confidence, review reasons, commercial notes and assistance disclosures remain internal.

Completed basketball game reports may add a `basketballRecap` object to article detail responses. The additive v1 object carries full-time score, four quarter totals, venue, attendance, officials, verified team comparisons and game leaders. The mobile article proof renders that box score ahead of the article image, while ordinary stories remain unchanged when the field is absent.

Completed football match reports may add a `matchRecap` object to article detail responses. The additive v1 object carries the final score and team marks, venue and city, attendance (or an explicit unavailable marker until an official figure is released), referee, both verified starting elevens with coaches, and a chronological goal, card and VAR timeline. The mobile article proof renders the score card, match events and both line-ups ahead of the article image; ordinary stories remain unchanged when the field is absent.

Every sports event has:

- canonical ILSP event, competition, season and participant IDs;
- scheduled start, actual start where available, venue timezone and neutral-venue flag;
- an enumerated status rather than free text;
- score segments appropriate to the sport;
- a `lastConfirmedAt` time and provider provenance kept server-side;
- field-level availability flags so an app never invents a table, player statistic or timeline that the licence does not supply.

Contract schemas live in `packages/api-contracts`. Continuous integration validates representative football, basketball, tennis, judo and multi-heat event fixtures before either client can consume a contract change.

The local `npm run contracts:validate` preflight currently enforces the implemented article-detail fixtures. For football it requires two unique eleven-player starting line-ups, supported goal/card/VAR incident types and valid scorelines; for basketball it requires four periods whose totals equal the final score. Mutation tests prove that incomplete line-ups and unsupported incidents fail rather than degrade silently.

`npm run mobile:validate` separately checks release-readiness evidence rather than the content contract itself. It requires five correctly gated release stages, verifies every recorded Gate 0 file exists, matches the responsive evidence timestamp to its machine-readable report and rejects responsive proof older than 24 hours. The current responsive proxy proof expires at 10:54 Asia/Jerusalem on 18 July 2026. Native acceptance remains explicitly blocked rather than inferred from web rendering.

The release record now also pins the article-detail schema plus the representative football, national-team basketball and club-basketball fixtures with a four-file SHA-256 snapshot. The mobile preflight recomputes every digest and fails if a recap contract changes without an explicit architecture review. It simultaneously enforces `en` as the only public launch locale; the RTL foundation remains available in code but does not authorise a Hebrew public launch.

## Mobile client quality bar

- Expo Router for typed navigation, universal links and Android app links.
- TanStack Query for network state; SQLite for the offline feed, saved articles and lightweight preferences.
- Images requested in device-appropriate sizes, cached locally and displayed without forced cropping when editorial metadata requires the complete frame.
- Skeleton states for short waits, meaningful empty states and an explicit last-updated state for scores.
- Dynamic Type, VoiceOver, TalkBack, reduced-motion support, contrast checks and minimum 44-point touch targets.
- Logical layout properties from day one so Hebrew can switch the interface to RTL without a second component tree.
- Brand motion used sparingly: score changes, tab transitions and live-state emphasis must remain fast and readable on low-end devices.

## Notifications and privacy

An installation receives a random ILSP identifier. Notification tokens are stored server-side, encrypted at rest and separated from editorial analytics. Anonymous use requires no account. Followed teams and sports remain on-device unless the user opts into cross-device synchronisation in a later release.

Push delivery uses APNs and FCM through one server-side notification service. Each alert needs a canonical event or article target, expiry time, locale, dedupe key and an editorial priority. Quiet hours and per-topic controls are mandatory. Breaking-news alerts require an explicit newsroom action; the ingestion process may prepare a draft but may not send autonomously.

Analytics at launch should be limited to product reliability and aggregate use: screen view, article open, score open, notification opt-in and crash data. Advertising identifiers, precise location and cross-app tracking are excluded. Any analytics or crash vendor remains a separate owner, contract and privacy approval.

## Security and operations

- TLS only, no provider keys or editorial write credentials in the applications.
- Per-route rate limits, payload ceilings, input validation and abuse monitoring at the gateway.
- Signed build-time configuration plus server-controlled feature flags; no remote code execution.
- Minimum supported app version and optional maintenance messages delivered through `/config`.
- Structured logs with request IDs, API latency, cache state and contract version; public errors contain no sensitive diagnostics.
- Separate development, staging and production environments with isolated credentials and notification projects.
- Dependency, secret, licence and mobile permission audits are release gates.

## Delivery sequence and release gates

### Gate 0 — contracts and prototype

Exit only when the API schemas validate, the home/article prototype uses real public ILSP data, English layouts pass phone-size checks and no secret is present in the binary.

### Gate 1 — internal alpha

Add navigation, offline reading, score-centre read models, deep links, saved stories and crash reporting in a non-production environment. Exit when the test suite passes on the current and previous major iOS and Android versions and on one constrained Android device profile.

### Gate 2 — private beta

Use Apple TestFlight and Google Play closed testing after owner approval. Add real push registration, consent copy, privacy links, accessibility review and a documented rollback path. Exit when crash-free sessions exceed 99.5%, cold start and feed-load budgets are met, and no severity-one content or score defect remains open.

### Gate 3 — public beta candidate

Complete store metadata, screenshots, age rating, privacy declarations, support routes and production monitoring. Run the full provider acceptance suite against every enabled competition. Exit only after owner, editorial and privacy sign-off.

### Gate 4 — store launch

Submission is a deliberate external action. It requires approved developer accounts, legal entity details, production domains, support inboxes, final terms and privacy review. Stage the rollout, watch crash and API-error budgets, and retain the ability to disable scores or notifications independently of editorial reading.

## Initial service targets

| Measure | Beta target |
|---|---:|
| crash-free sessions | at least 99.5% |
| cached home render | under 500 ms on reference devices |
| uncached home response, p95 server time | under 800 ms |
| article API availability | 99.9% monthly |
| live-score freshness | within the licensed provider SLA, visibly timestamped |
| notification duplicate rate | below 0.1% |
| critical accessibility defects | zero at release |

These are acceptance targets, not public promises, until production traffic and provider contracts make them supportable.

## Next executable work

The locale contract, first versioned article and score schemas, read-only API routes, typed football and basketball recap contracts and Expo feed/detail proof now exist locally. The English responsive acceptance matrix has passed in web rendering and is now time-bounded by the mobile evidence preflight; the mobile detail implementation includes the basketball box score plus a complete football score card, event timeline and starting elevens. Keep the exact recap-contract snapshot green, refresh the responsive proxy evidence before its recorded expiry, then repeat feed, detail, cache, rotation and large-text acceptance natively when local iOS Simulator and Android emulator runtimes are available. Developer accounts, device distribution and store work remain outside that step.
