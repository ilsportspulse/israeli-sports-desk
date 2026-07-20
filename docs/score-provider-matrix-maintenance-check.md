# Score-provider matrix maintenance check

Checked: 17 July 2026, 10:15 Asia/Jerusalem  
Visibility: internal  
Scope: provider-evidence currentness and football-recap completeness; provider claims and prices not refreshed

## Result

The score-provider decision remains usable and fail-closed. The machine-readable record still contains six provider positions, seventeen sport or athlete-system rows, thirteen distinct pre-purchase acceptance checks and fifteen HTTPS research links. It now also carries twelve explicit football match-report requirements covering final score, exact participants, venue, attendance, referee, both starting elevens, events, statistics, corrections and verification. No trial, account, licence request, contact or purchase was opened.

This check did not refresh advertised prices or change any provider recommendation. Existing provider claims were last checked on 16 July 2026 and are now subject to a 31-day fail-closed age limit ending on 16 August 2026. They remain planning inputs, not purchase advice. A later pricing refresh must use current official provider pages and must not imply that ILSP has display rights.

## Gate review

- Sportmonks remains a football trial candidate, not an approved production source.
- Goalserve remains the first priced multi-sport bundle to test, not a purchase recommendation.
- Sportradar remains the enterprise benchmark, with exact competition depth and production rights unverified.
- API-Sports remains a technical coverage test only because its public terms do not themselves grant publication rights.
- TheSportsDB remains a metadata and continuity fallback, not proof of complete Israeli competition coverage.
- The existing OpticOdds route remains unusable for public editorial scores until its licensed scope, retention and derived-display rights are documented.

## Structural acceptance

The thirteen-point suite still covers exact current competition identity, schedule and Jerusalem time, exceptional match states, latency and corrections, incident identity, confirmed line-ups, competition-specific standings, separate women/youth/lower-tier proof, transliteration, channel display rights, marks and image rights, data lifecycle terms and a seven-day parallel run.

The release rule is unchanged: every required competition must pass separately. Country-level or sport-level marketing claims are not sufficient evidence, and manual federation data must carry a visible checked time rather than a false live label.

`npm run scores:validate` now provides a fail-closed local preflight. It verifies the six unique provider positions, seventeen unique sport rows, thirteen acceptance checks, twelve football-recap requirements, fifteen HTTPS research links, rights-risk and fallback fields, matching maintenance counts and the absence of trials, accounts, purchases, contacts or production-approved labels. It also rejects evidence dated in the future or older than the 31-day planning window; a mutation test proves the stale-evidence branch fails.

The preflight validates the integrity of the current planning record. It does not refresh prices, confirm competition depth, grant display rights or authorise a provider trial.

## Next executable action

Refresh the official provider claims before 16 August 2026 and keep both `npm run scores:validate` and `npm run contracts:validate` green while provider trials remain behind owner approval. If the owner later authorises a trial, create the competition registry first, capture written display terms, and record both the competition checks and twelve recap-field results without purchasing anything.
