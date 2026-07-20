# ILSP partner-pack consistency check

Status date: 17 July 2026  
Visibility: internal maintenance record; no external action authorised.

## Materials checked

- `docs/partner-one-page-brief.md`
- `docs/aws-activate-application-fact-sheet.md`
- `docs/maccabi-world-union-eight-week-pilot.md`
- `docs/funding-plan.md`
- `docs/partner-first-five-qualification.md`

## Current controlled positions

| Field | Controlling position | Result |
|---|---|---|
| Founding-partner price | USD 30,000 for twelve months, draft until owner approval and contract | Consistent in the one-page brief and funding roadmap |
| Founding inventory | Up to three non-competing positions with no editorial, ranking, corrections or data rights | Consistent with the editorial firewall |
| Funding context | USD 213,790 twelve-month cash requirement plus a USD 30,000 in-kind target | Brief states that one partnership funds only part of the runway |
| AWS route | Activate Founders self-funded route; planning ask begins at USD 1,000 and remains subject to current eligibility | Kept separate from commercial partner pricing |
| AWS planning total | USD 2,110 eligible usage over twelve months | Internally consistent with the application fact sheet; not presented as a quote |
| Maccabi World Union route | Eight-week non-cash distribution-and-archive pilot | Kept separate from the paid founding-partner offer |
| Editorial independence | No story approval, source control, ranking influence, corrections control or subscriber-level data access | Consistent across all three packs |
| External action | Owner approval required before application, outreach, account creation, sending or contract | Consistent across all three packs |

## Correction made

The one-page brief previously named future Hebrew editions as a funding use. That no longer matched the owner's instruction to stop Hebrew editorial translation. The line now preserves a language-neutral foundation while making clear that Hebrew translation is not on the current roadmap and that any future language edition needs a separately selected audience and owner approval.

## Rendered-artifact release check

The one-page PDF was rebuilt on 17 July after the preflight detected that it predated the corrected editable source. The rendered A4 artifact remains one page, carries the controlled title metadata and now says “language-neutral foundations” rather than implying an active multilingual expansion. The latest render was inspected at 150 dpi with no clipping, overlap, broken glyphs or unreadable copy.

`npm run partners:brief:validate` now fails closed when the editable brief loses the controlled price, term, inventory cap, English audience, editorial firewall, owner gate or current no-Hebrew-translation position. It also rejects a PDF that is empty, malformed, no longer one page or older than the editable source. The editable brief, this consistency record and the rendered PDF must all remain inside a 31-day owner-review window; the current evidence expires on 16 August 2026 at 20:31 Asia/Jerusalem. A machine-readable result with hashes, evidence age and exact expiry is written to `data/partner-brief-release-readiness.json`.

## Maintenance trigger

Repeat this check and rebuild the PDF after a change to the USD 30,000 price, inventory, twelve-month funding model, audience, language position or editable source. Refresh all three release-evidence artifacts before 16 August 2026 even if their controlled content is unchanged. Keep `npm run partners:brief:validate` green before any owner review or authorised external use. The next executable launch-roadmap item is a freshness check of the fourteen-day social launch manifest against the current English-only positioning.
