# ILSP social launch manifest freshness check

Status date: 17 July 2026  
Visibility: internal maintenance record; no account, schedule or post is authorised.

## Scope

This check covers the fourteen-day launch sequence in `data/social-launch-manifest.json`, the three reusable SVG masters and the corresponding rules in `docs/social-launch-kit.md` and `docs/social-asset-system.md`.

## Results

| Check | Result |
|---|---|
| Day sequence | Days 1–14 are present exactly once |
| Template references | Every primary and secondary reference resolves to one of the three existing master SVGs |
| Dynamic news slots | No dated story, score or athlete is hard-coded before a launch date exists |
| Current-story snapshot | Seven distinct internal candidates cover Match Centre, Israelis Abroad, youth, Israeli football, column, archive and major-international roles |
| Candidate freshness | Every candidate was published inside its declared 24–48-hour window at the 09:20 Jerusalem check |
| Candidate media | All seven candidates resolve to different local files with captions, credits and licence metadata |
| Structured story proof | Football and basketball candidates fail closed unless their required interactive recap payload exists |
| English positioning | Launch content is explicitly English-only; no Hebrew translation or bilingual duplicate is promised |
| Media controls | Exact matching media, full-frame treatment, unique use, caption, credit and licence remain mandatory |
| Live-data controls | Result cards require confirmed match status, score, scorers and Jerusalem time |
| Workflow language | The day-eight support post now uses the public-facing “The Name Desk: Israeli names in English” concept instead of describing verification mechanics |
| Authority gates | Account registration, launch date, public URL, sign-up route, first-wave scheduling and every post remain owner-controlled |
| Automated preflight | `npm run social:validate` fails closed on missing days, missing SVG masters, invalid template references, local preview URLs, non-English launch positioning, weakened owner gates, stale candidate inputs, missing structured recaps or incomplete media provenance |
| Snapshot expiry | The candidate proof is capped at 12 hours; the validator and mutation test now reject it after expiry instead of returning only an advisory finding |

## Decision

The manifest remains launch-ready as a dynamic fourteen-day framework. A separate internal snapshot now proves that the current newsroom can populate the principal launch roles without repeating a story or media file. Those candidates are not assigned to public days, scheduled or authorised for posting.

The automated preflight is part of the local release gate. It validates structure, candidate freshness, structured recap requirements, media provenance and authority controls; it does not authorise account creation, populate public slots, schedule posts or replace the launch-date freshness review. An expired snapshot now makes the preflight fail, and the test suite proves that a scheduling batch cannot reuse it.

## Next trigger

Refresh the internal candidate snapshot before its 17 July 21:20 Jerusalem expiry if a later proof is needed. Repeat the full check after a launch-date decision, template or channel-order change, new public sign-up route or material editorial-positioning update.
