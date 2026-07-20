# Israel Sports Pulse — complete Claude handoff

Status: 17 July 2026, 14:18 Asia/Jerusalem  
Purpose: private operating handoff for continuing the complete ILSP project in Claude or another coding workspace.  
Project root in the handoff ZIP: `project/israeli-sports-desk`

## 1. What ILSP is

Israel Sports Pulse (ILSP) is an English-language Israeli sports newsroom and supporter product. It combines substantial original reporting, scores and fixtures, permanent archive features, columns, a daily quiz, social distribution and future mobile apps. Its primary audience is English-speaking Israelis, the Jewish diaspora, international supporters of Israeli clubs and athletes, and readers who need reliable Israeli-sport context without fluent Hebrew.

The founder, Patrick Vanden Broek, was born in Tel Aviv in 1973 to an Israeli mother and Belgian father and moved to Belgium in 1982. His connection to Israeli culture, food, mentality and sport remained central. Israeli players such as Elyaniv Barda, Barak Itzhaki and Lior Refaelov in Belgian football made the information gap especially visible. A decade-old ambition to unite English-speaking Israeli-sport followers is now being built as a real product.

Privacy boundary: Patrick's name, portrait and detailed biography are authorised in the private funding presentation. The public website must remain founder-anonymous and must not show his portrait, direct contact route or unnecessary identifying detail unless Patrick explicitly changes that decision.

## 2. Current product state

- Local Next.js newsroom, score centre, permanent story/archive/column indexes, public About page and four governance pages.
- 129 article records: 77 published and 52 in review at this snapshot.
- Latest dry discovery: 198 scanned URLs, 190 already seen, 8 candidates; source mix ONE 3, Sport5 3, Walla 0, Ynet 0 and Sport1 2.
- Category badges show the real section on mobile and desktop, including Israeli Football, Basketball, Israelis Abroad, Swimming and MMA instead of generic `News`.
- Exact-media policy is enforced: an unrelated photograph is never an acceptable substitute.
- A reusable 41-scenario responsive browser matrix covers 360, 390 and 1440-pixel home, article, About and governance routes.
- A typed Expo SDK 57 mobile proof and versioned public API contracts exist. English is the only public launch language; Hebrew infrastructure remains dormant and development-only.
- Production is not deployed. The product remains a local preview with external authority gates intact.

Start with these sources of truth:

- [`docs/project-board.md`](project-board.md): living roadmap, evidence and owner gates.
- [`data/project-progress.json`](../data/project-progress.json): machine-readable workstream status.
- [`data/ingestion-report.json`](../data/ingestion-report.json): latest newsroom cycle report.
- [`config/sources.json`](../config/sources.json): enabled sources and configured discovery volume.
- [`package.json`](../package.json): available checks and operating commands.
- [`README.md`](../README.md): local product overview and setup.

## 3. Binding newsroom cycle

Run the newsroom cycle every 30 minutes only when explicitly requested or when an authorised scheduler is already active.

1. Discover against every enabled source in `config/sources.json`, preserving ONE and Sport5 volume leadership while checking Walla Sport, Ynet Sport and Sport1/Maariv. Obey robots.txt, delays, terms and the repository source-permission policy.
2. Target 5–10 genuinely distinct updates per hour only when source flow supports them. Do not pad with duplicate angles, rumours, thin rewrites or low-interest filler.
3. Cover the full Israeli sports system: all covered football and basketball divisions, women, youth, national teams, handball, volleyball, judo, gymnastics, athletics, swimming, cycling, tennis, motorsport, MMA, boxing, wrestling, water sports, Paralympic sport and Israelis abroad. Major international coverage is limited to genuinely consequential events.
4. Read only the bounded source material needed. Never copy or closely translate. Write confident, idiomatic English sports journalism, not a publisher digest.
5. Publication gate: at least five substantive paragraphs, four confirmed facts, 220 body words for news, 200 for explainers or 300 for analysis, plus one claim-specific independent or authoritative verification URL.
6. Verify unfamiliar Hebrew names and every material identity, result, contract, injury, disciplinary status and competition fact. Never invent a fact, quote, score, injury, transfer or identity. Preserve uncertainty.
7. Deduplicate by source URL, canonical event key and semantic event identity. Merge an evolving event instead of publishing duplicate reports.
8. Publish only high-confidence reports to `data/articles.json`; keep weaker work in review. Rank homepage priority by impact, freshness and continuing relevance.
9. Media ladder: exact current rights-cleared event image; exact recent player/team file photo with honest context; permitted official social embed; unique factual ILSP editorial visual. Do not fabricate likenesses or reuse one local image for different stories. Preserve the full frame and complete credit/licence metadata.
10. Never expose editorial workflow, automation, verification mechanics, AI assistance, feed delays, rights-management explanations, local-preview state or review/confidence status to readers.
11. Maintain one fresh, sourced ILSP column per Asia/Jerusalem day when facts support an argument; maintain one substantial historical Israeli-sport feature and exactly five source-backed quiz questions per day.
12. Audit every promoted lead, hero, ticker, trending item, column, international lead, archive feature and every changed story.
13. Run tests, audit and lint, then update `data/ingestion-report.json` with discovery, publication/review/merge counts, sport coverage, homepage/media findings, quality gates and errors.
14. After the newsroom gate, advance one safe local item from the project board when capacity allows. Record evidence and next action in both project status files.

## 4. Funding and partner pack

Completed private assets:

- Editable 14-slide deck: [`outputs/ilsp-founding-partner-deck.pptx`](../outputs/ilsp-founding-partner-deck.pptx)
- Visually verified full-deck PDF: [`output/pdf/ilsp-founding-partner-deck.pdf`](../output/pdf/ilsp-founding-partner-deck.pdf)
- Funding model: [`outputs/ilsp-launch-funding-model.xlsx`](../outputs/ilsp-launch-funding-model.xlsx)
- Financial reality check: [`docs/funding-model-reality-check.md`](funding-model-reality-check.md)
- One-page partner brief: [`docs/partner-one-page-brief.md`](partner-one-page-brief.md)
- One-page PDF: [`output/pdf/ilsp-founding-partner-brief.pdf`](../output/pdf/ilsp-founding-partner-brief.pdf)
- Scalable outreach and full mail sequence: [`docs/partner-outreach-scale-plan.md`](partner-outreach-scale-plan.md)
- Existing outreach controls: [`docs/outreach-kit.md`](outreach-kit.md)
- Private authorised portrait asset: `outputs/deck-assets/founder-patrick-vanden-broek.jpeg`

Current financial conclusion:

- Lean cash target: USD 56,135.
- Professional cash target: USD 213,790.
- Full cash target: USD 560,561.
- All workbook formulas reconcile.
- The professional scenario is plausible only as a founder-led blended freelance/part-time year-one operation, not a fully staffed senior corporate newsroom.
- Payroll taxes, employee benefits, equipment, rights, legal, insurance and production-grade licensed-data costs require local quotes before commitment.
- Sponsor prices and conversion ranges are planning hypotheses until real audience and outreach data exist.

The deck now explains partner value: defined inventory, visible relevance, credible audience access, measured delivery, purpose/trust association, early category position, category protection and an editorial firewall. It uses a planning funnel of 500 qualified targets, 300 personalised approaches, 30–60 replies/referrals, 15–30 meetings/reviews, 6–12 proposals/pilots and 3–6 funded or in-kind relationships. These ranges are workload assumptions, never promises.

No external email, application, partner contact, account creation, purchase or contract has been authorised or executed.

## 5. Funding/outreach continuation

1. Patrick reviews the 14-slide deck, founder wording, USD 30,000 founding-product anchor and USD 213,790 professional target.
2. Upgrade the workbook to monthly cash flow with jurisdiction-specific payroll taxes, employer costs, equipment/depreciation, insurance, legal and current rights/data quotes.
3. Expand the researched pipeline from 12 records toward 500 qualified organisations across five route types: cash/product sponsors, infrastructure/data, grants/community, distribution and launch services/in-kind.
4. Prepare the first 25 target-specific openings. Do not send. Record target, evidence, route, ask, conflict, decision owner, sender identity, attachment and expiry.
5. After Patrick separately approves the exact batch, recipient routes, sender identity, messages and attachments, external sending may begin. Approval for one batch does not authorise later batches.
6. Track actual delivery, reply, referral, meeting, proposal, pilot, funding and in-kind conversion. Replace planning ranges with measured rates only after sufficient observations.

## 6. Other open roadmap items

- Continue the 30-minute newsroom and promoted-story integrity audit.
- Keep the partner brief, score-provider, governance, mobile, API and social preflights current.
- Obtain professional trademark, legal/privacy, business-entity and contract review.
- Activate owner-controlled domain and mailboxes only after approval; all project addresses are currently unverified.
- Trial licensed data providers only after approval and verify exact Israeli competition coverage, display rights and full recap fields before purchase.
- Run the existing mobile acceptance matrix on real local iOS Simulator and Android emulator runtimes when available.
- Production deployment, account registration, app-store work, social posting, outreach, contracts and purchases remain blocked until explicit owner approval.
- Keep the public site English-only unless Patrick chooses another non-Hebrew target audience. Do not restart Hebrew editorial translation by default.

## 7. Core verification commands

From `project/israeli-sports-desk` after installing dependencies:

```bash
npm test
npm run audit
npm run lint
npm run build
npm run social:validate
npm run governance:validate
npm run scores:validate
npm run contracts:validate
npm run mobile:validate
npm run partners:validate
npm run partners:intake:validate
npm run partners:brief:validate
```

Use `npm run ingest:dry` before changing newsroom data. Use `npm run ingest` only within the authorised local cycle. Do not run `npm run audit:apply` blindly; inspect proposed story changes first.

## 8. Local development and change discipline

- Preserve the dirty worktree and unrelated user changes. Never reset, clean, mass-delete or overwrite without explicit instruction.
- Use `rg` for search and repository conventions for edits.
- The local server normally runs on `http://127.0.0.1:3000`. Do not restart it unless necessary. If styling appears broken on both mobile and desktop, check for two competing server processes and missing Next.js assets before changing CSS.
- Never expose `.env`, tokens, cookies, mail credentials or personal-data lists. The handoff ZIP intentionally excludes local environments, caches and Git history.
- For deck edits, change `scripts/build-sponsor-deck.mjs`, rebuild the PPTX, run the slide overflow test, visually inspect all slides, export the PDF and render every PDF page for final inspection.
- For workbook edits, use formulas for derived values, add clear assumption/status notes and verify recalculation plus formula-error scans.

## 9. Important internal documentation

- Brand/accounts: [`docs/brand-and-accounts.md`](brand-and-accounts.md)
- Operations roadmap: [`docs/operations-roadmap.md`](operations-roadmap.md)
- Governance launch: [`docs/governance-launch-checklist.md`](governance-launch-checklist.md)
- Social kit and assets: [`docs/social-launch-kit.md`](social-launch-kit.md), [`docs/social-asset-system.md`](social-asset-system.md)
- Partner targets and decisions: [`docs/partner-targets.md`](partner-targets.md), [`docs/partner-owner-decision-brief.md`](partner-owner-decision-brief.md), [`docs/partner-first-two-submission-drafts.md`](partner-first-two-submission-drafts.md)
- Score providers: [`docs/score-provider-coverage-matrix.md`](score-provider-coverage-matrix.md)
- Mobile/API: [`docs/mobile-app-api-architecture.md`](mobile-app-api-architecture.md), [`docs/mobile-device-acceptance.md`](mobile-device-acceptance.md)
- Multilingual boundary: [`docs/multilingual-and-rtl-foundation.md`](multilingual-and-rtl-foundation.md)

## 10. Verified public pricing references

- [Vercel pricing](https://vercel.com/pricing)
- [Supabase pricing](https://supabase.com/pricing)
- [Resend pricing](https://resend.com/pricing?volume=50000)
- [Apple Developer Program](https://developer.apple.com/programs/whats-included/)
- [Google Play Console registration fee](https://support.google.com/googleplay/android-developer/answer/14659200?hl=en)
- [Sportmonks football API pricing](https://www.sportmonks.com/football-api/plans-pricing/)
- [API-Football pricing](https://www.api-football.com/pricing)

Recheck every price immediately before a financial or purchasing decision.

## 11. Definition of a good handoff turn

A good continuation reads the current board and relevant files, makes the smallest complete safe improvement, verifies it proportionately, updates the board and progress JSON when status changed, preserves owner gates and reports separately on newsroom and launch-roadmap work. It never claims an external action occurred when none did and never invents audience traction, financial certainty or partnership interest.
