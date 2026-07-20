# ILSP multi-sport score-provider decision record

Status: internal research complete; provider trials and contracts remain owner-approval gates.  
Checked: 16 July 2026. Prices are planning figures, exclude tax and may change.

## Decision

There is no credible low-cost, one-feed route that can presently be said to cover the full Israeli sports system at production depth. ILSP should therefore launch the score product in controlled layers:

1. Keep TheSportsDB as a clearly labelled preview and metadata fallback while the commercial feed is selected. It must not be presented as a complete live service.
2. Trial Sportmonks Starter for the five most important football competitions because the existing ILSP adapter already supports multiple configured seasons. Do not subscribe until Ligat Ha'al, Liga Leumit, the State Cup, Toto Cup and the required UEFA competition have each passed the acceptance test below.
3. In parallel, request written commercial-display terms and competition-level samples from a multi-sport provider. Goalserve is the first priced bundle to test; Sportradar is the enterprise benchmark. Neither is approved until Israeli basketball, handball, volleyball and the relevant international sports pass the same test.
4. Use federation and competition records as the authoritative editorial source for sports without a suitable feed. Manual publishing can support verified schedules, results and tables, but it must never be described as live.
5. Keep odds, predictions and betting markets out of the reader product. ILSP needs fixtures, status, scores, incidents, line-ups, statistics and tables only.

The cheapest advertised subscriptions are not automatically publication licences. API-Sports explicitly says its subscription does not grant permission to publish the data and that logos and trademarks may require separate rights. It is useful for a technical trial only unless ILSP receives the necessary written permissions. The same rights check applies to every provider, even where a product is sold for websites or applications.

## Current ILSP architecture

The score centre already has a provider-neutral event, standings and coverage model, a two-minute refresh, a safe empty state and adapters for TheSportsDB, Sportmonks and the existing FeedTheBet/OpticOdds pipeline. The current production-quality gaps are:

- no single adapter combines multiple providers by sport;
- the Sportmonks adapter is football-only;
- live incidents, line-ups and statistics are not yet mapped into the public model;
- provider health is global rather than per sport and competition;
- logos are rendered from provider URLs without a competition-by-competition rights record;
- no reconciliation layer flags conflicting scores, late corrections or abandoned fixtures.

The next implementation should create one server-side provider registry and normalisation layer, not add provider-specific logic to the page.

## Provider comparison

| Provider | Advertised scope and relevant depth | Current public price | Israel evidence | Rights and operational assessment | ILSP role |
|---|---|---:|---|---|---|
| TheSportsDB | Broad schedules, results, tables and artwork; premium advertises two-minute live scores for soccer plus the major US leagues | Small Business: USD 200/year; Single Developer: USD 90/year | Current ILSP lookups resolve Israeli top-flight and second-tier football and basketball records, but depth is incomplete and crowd-sourced | Paid use permits services with attribution; app-store publication requires paid access. Trademarks must remain unaltered and third-party content still requires permission | Preview, metadata and continuity fallback only |
| Sportmonks Football API | Fixtures, live scores, events, line-ups, statistics and tables across selected football leagues | Starter: EUR 29/month for 5 leagues; Growth: EUR 99/month for 30; 14-day trial | Exact Israeli competition inventory is not exposed in a stable public page and must be enumerated in the trial | Strong technical fit and an adapter already exists. Written confirmation is still required for public data and logo display | Preferred football trial |
| API-Sports | Separate football, basketball, handball, volleyball and MMA products; coverage varies by competition | Football Pro: USD 19/month; basketball, handball and volleyball Pro: USD 15/month each; MMA Pro: USD 10/month | Lists Israeli Ligat Ha'al, Liga Leumit, Liga Alef and domestic cups; basketball Super League, Liga Leumit, women and cups; handball Division 1; volleyball Premier League | Low-cost technical option, but its terms explicitly do not grant publication rights and warn that competition data and visual assets may need further permission | Trial/reference only until written rights are secured |
| Goalserve | Full-package XML/JSON feeds across 20+ sports, including live scores, fixtures and statistics | USD 800/month, USD 3,550/6 months or USD 5,100/year; websocket add-on extra | Public material does not establish the required Israeli competition depth | Plausible mid-market single-feed route. Contract, latency, correction policy, data rights and exact league list all need written confirmation | First multi-sport commercial trial candidate |
| Sportradar Media APIs | B2B APIs across football, global basketball, tennis, handball, indoor volleyball, MMA, cycling, racing, water polo, Olympics and many other sports; depth varies by competition | Custom production quote; self-service trials normally 30 days, 1,000 calls and 1 QPS | Interactive coverage matrix must be checked competition by competition | Broadest credible enterprise benchmark. Production is customer-only; some image products require separate sales access | Enterprise benchmark and scale-up option |
| Existing FeedTheBet / OpticOdds route | The local integration exposes live and prematch fixtures from an odds-oriented feed | Existing internal relationship; public price not stated | Must be enumerated from the licensed account rather than assumed | Useful as a technical source only if the existing contract expressly permits consumer editorial display. Do not expose prices or betting markets | Contingent supplementary source |

## Sport-by-sport launch matrix

`Live` means a licensed feed with a defined refresh and correction process. `Verified` means an authoritative result can be published editorially but is not represented as a live feed.

| Sport / audience need | Minimum Israeli and major-global scope | Low-cost evidence | Enterprise or official fallback | Launch state |
|---|---|---|---|---|
| Men's football | Ligat Ha'al, Liga Leumit, Liga Alef, State Cup, Toto Cup, Super Cup; UEFA club and national-team competitions, World Cup | API-Sports lists the domestic pyramid and cups; Sportmonks must be trial-enumerated | Sportradar or Goalserve; IFA and competition records for verification | Trial required before live launch |
| Women's and youth football | Women's top division and cup, youth leagues and national teams | No complete low-cost coverage verified | IFA/UEFA/FIFA records; enterprise feed only after competition-level proof | Verified/manual first |
| Men's basketball | Winner League, Liga Leumit, State/League cups; EuroLeague, EuroCup, FIBA, NBA | API-Sports lists Super League, Liga Leumit and cups | Sportradar Global Basketball or Goalserve; BSL, IBBA, EuroLeague and FIBA records | Multi-sport trial required |
| Women's and youth basketball | Women's league/cup and national youth teams | API-Sports lists WBL Women, but depth is not guaranteed | IBBA and FIBA records | Verified/manual first |
| Handball | Men's and women's top divisions, cups, national teams; EHF/IHF events | API-Sports lists only Israeli Division 1 | Sportradar or Goalserve; Israel Handball Association, EHF and IHF records | Partial trial; manual gaps |
| Volleyball | Men's and women's premier divisions, cups, national teams; CEV/FIVB events | API-Sports lists only Israeli Premier League | Sportradar or Goalserve; Israel Volleyball Association, CEV and FIVB records | Partial trial; manual gaps |
| Tennis | Israeli players on ATP, WTA, ITF and Grand Slam circuits; Davis and Billie Jean King Cups | No suitable Israel-centred low-cost feed verified in the current shortlist | Sportradar Tennis or Goalserve; ATP, WTA, ITF and official tournament records | Enterprise or official/manual |
| Judo | IJF World Tour, European events, Israeli championships and Olympics | No suitable commercial API verified | IJF, EJU, Israel Judo Association and Olympic records | Official/manual |
| Gymnastics | World Cups, European/world championships, Israeli events and Olympics | No suitable commercial API verified | FIG, European Gymnastics, Israeli federation and Olympic records | Official/manual |
| Athletics | Israeli championships and athletes abroad; European/world/Olympic events | No suitable commercial API verified | World Athletics, European Athletics, Israeli association and Olympic records | Official/manual |
| Swimming and water sports | National championships, European/world/Olympic meets; sailing and water polo | No broad low-cost feed verified | World Aquatics and federation records; Sportradar lists water polo and Olympics | Official/manual; water-polo trial later |
| Cycling | Israel-Premier Tech, Israeli riders, Grand Tours, world/Olympic events | No suitable low-cost feed verified | Sportradar Cycling or Goalserve; UCI and official race records | Enterprise or official/manual |
| MMA | Israeli fighters plus major promotions and title events | API-Sports offers a dedicated MMA API | Sportradar MMA or Goalserve; promotion and commission records | Optional trial after core team sports |
| Boxing and wrestling | Israeli athletes, sanctioned international and Olympic events | No suitable commercial API verified | Sanctioning bodies, United World Wrestling, federations and Olympic records | Official/manual |
| Motorsport | Israeli drivers/riders, F1, Formula E, MotoGP and major series | Sportmonks and API-Sports offer F1 rather than the full Israeli need | Sportradar Racing or Goalserve; FIA/FIM and series records | Enterprise or official/manual |
| Paralympic sport | Israeli national-team and individual results across disciplines | No suitable cross-sport commercial API verified | IPC, event and national Paralympic records | Official/manual |
| Israelis abroad index | Identity map linking Israeli athletes to their club/team and competition feed | Must be built locally regardless of provider | Authoritative roster and federation records | Build after provider selection |

## Minimum viable licensed stack

### Lean launch

- Sportmonks Starter only if five selected football competitions pass a 14-day trial and written display rights are acceptable.
- TheSportsDB Small Business as a low-cost continuity and metadata source only if owner approval is given and attribution is implemented.
- Authoritative manual results for basketball, handball, volleyball and Olympic sports until a licensed feed passes acceptance.
- Public labels must distinguish `Live`, `Final`, `Scheduled` and `Last checked`; manual data must never animate or imply real-time status.

Planning floor: EUR 29/month plus USD 200/year, before tax, rights-holder permissions and engineering. This is not full multi-sport live coverage.

### Professional launch

- One multi-sport contract with Goalserve or another provider that passes the required Israeli competition tests.
- Retain Sportmonks only if its football depth or incident quality is materially better than the bundle.
- A federation-source fallback and correction log for every sport.

Advertised Goalserve planning figure: USD 5,100/year for the all-sports package. The price is not a recommendation until the exact competition schedule and editorial-display licence are contractually confirmed.

### Enterprise launch

- Sportradar B2B products selected from its coverage matrix, with a negotiated production quote, service levels, correction process, translations and explicit website/app/social display rights.
- Separate image agreement where team marks, headshots or action photography are required.

## Acceptance test before any purchase

For every required competition, the trial or sample must pass all of these checks:

1. The current season and competition ID exist and future fixtures match the authoritative schedule.
2. Jerusalem kick-off time, postponements, abandoned status and extra-time/penalty states are correct.
3. Live scores update within the contracted interval and late corrections propagate.
4. Incidents identify the correct team, player, minute and event type.
5. Line-ups are explicitly confirmed rather than predicted.
6. Standings handle the competition's points, split, playoff and tiebreak rules.
7. Women's, youth and lower-tier coverage is tested separately; country-level presence is not enough.
8. Transliteration is stable, while ILSP's namebook remains authoritative for public English.
9. The contract permits editorial website, app, alert, newsletter and social display in ILSP's launch territories.
10. Team crests, player images and competition marks have an explicit licence or are excluded and replaced with ILSP's rights-cleared assets.
11. Data export, caching, retention, attribution, correction and termination rights are documented.
12. A seven-day parallel run records missing events, score latency, conflicting results and uptime before go-live.

## Engineering next step after owner approval

Add a `ScoreProvider` interface and competition registry, then run providers server-side through one normaliser. Cache schedules and tables for five minutes, poll active fixtures at the contracted interval, and retain the last verified state with a visible timestamp during outages. Each event should keep `provider`, `providerEventId`, `competitionId`, `verificationSource`, `rightsProfile`, `lastProviderUpdate` and `lastVerifiedAt` internally. The public client receives only the normalised event and safe health label.

## Football match-report completeness gate

A provider passing basic live-score acceptance is not automatically sufficient for an ILSP match report. Before its data may populate a completed football recap, a competition sample must also prove the twelve machine-readable requirements in `data/score-provider-coverage.json`: full-time status and score; exact teams and licensed marks or a safe fallback; kickoff, venue and city; sourced attendance; referee; both confirmed starting elevens and coaches; goals with scorers, assists, minutes and score progression; all yellow, second-yellow and red cards; substitutions; confirmed and licensed core team statistics; VAR decisions and corrections; and claim-specific verification URLs with a last-confirmed time.

Missing optional fields must be omitted honestly, never inferred. Missing final score, team identity, the two starting elevens, goal/card timeline or authoritative verification blocks automatic match-centre promotion and returns the recap to review.

## Primary sources

- API-Sports football, basketball, handball, volleyball and MMA product pages: <https://api-sports.io/sports/football>, <https://api-sports.io/sports/basketball>, <https://api-sports.io/sports/handball>, <https://api-sports.io/sports/volleyball>, <https://api-sports.io/sports/mma>
- API-Sports terms: <https://api-sports.io/terms>
- Sportmonks plans and Football API: <https://www.sportmonks.com/football-api/plans-pricing/> and <https://www.sportmonks.com/football-api/>
- TheSportsDB pricing, documentation and terms: <https://www.thesportsdb.com/docs_pricing.php?billing=annual>, <https://www.thesportsdb.com/documentation>, <https://www.thesportsdb.com/docs_terms_of_use.php>
- Goalserve full-package pricing: <https://www.goalserve.com/contact-us/sport-data-feeds/full-package-api/prices>
- Sportradar getting started and account/trial documentation: <https://developer.sportradar.com/getting-started/docs/get-started>, <https://developer.sportradar.com/getting-started/docs/your-account>
- OpticOdds product and developer documentation: <https://opticodds.com/> and <https://developer.opticodds.com/docs/odds-api-getting-started-guide>
