# ILSP mobile device acceptance record

Status date: 17 July 2026  
Scope: local prototype only; no store accounts, beta distribution or external services were used.

## Acceptance result

The English shared Expo client now passes three responsive-web checks at 2× density: 390 × 844 portrait, 844 × 390 landscape and a 390 × 844 portrait run with text enlarged to 200%. Each browser run reported a document width equal to its viewport width. The language control remained reachable, score and story cards stayed inside the viewport, media retained its complete frame and long headlines wrapped instead of clipping.

The landscape and 200%-text scenarios were recaptured on 17 July 2026 after the mobile release-evidence audit. Both still pass, and the machine-readable timestamp now expires after 24 hours rather than remaining indefinitely launch-credible. The same audit exposed and cleared a TypeScript defect in football recaps whose official attendance has not yet been published: the detail screen now renders the explicit unavailable marker accepted by the public contract.

The first portrait render exposed a genuine horizontal-layout defect in the header, score card and story copy. The first 200% text run then exposed a separate accessibility defect: the one-line brand title was truncated. The feed now derives native widths from the active window, uses viewport-safe sizing on web and allows the brand name to wrap under large text. This record therefore captures corrected acceptance passes rather than design-only review.

An earlier Hebrew interface render remains as historical proof of the dormant locale foundation. It is no longer an active product-acceptance target following the owner decision to keep ILSP's editorial product in English.

## Evidence

- English 390 × 844 render: `outputs/mobile-qa/feed-en-390x844@2x.png`
- English 844 × 390 landscape render: `outputs/mobile-qa/feed-en-landscape-844x390@2x.png`
- English 200% text render: `outputs/mobile-qa/feed-en-large-text-390x844@2x.png`
- Machine-readable responsive result: `outputs/mobile-qa/responsive-qa-report.json`
- Reusable capture and assertion script: `scripts/capture-mobile-responsive-qa.mjs`
- Feed implementation: `prototypes/mobile/app/index.tsx`
- Responsive header: `prototypes/mobile/src/header.tsx`

## Check matrix

| Check | Result | Evidence or blocker |
|---|---|---|
| TypeScript client check | Pass | `npm run typecheck` in the mobile workspace |
| Universal web export | Pass | Expo Router production export completed |
| English 390 × 844 layout | Pass | Exact device emulation; document width equalled viewport width |
| English 844 × 390 rotation proxy | Pass | Landscape viewport; document width equalled the 844-pixel viewport |
| English 200% text proxy | Pass | Brand wraps, language control remains visible and the 390-pixel viewport has no horizontal overflow |
| Full-frame editorial media | Pass | `contain` rendering kept the complete seeded visual visible |
| Offline last-successful-response fixture | Pass | Seeded local cache loaded feed, score and article summary without a live API |
| iOS Simulator | Blocked locally | Xcode Command Line Tools are selected, but `simctl` and an iOS Simulator runtime are unavailable |
| Android emulator | Blocked locally | `emulator` and `adb` are unavailable on the current command path |

## Remaining acceptance work

Native device acceptance is not claimed. Once an iOS Simulator runtime and an Android emulator are available, repeat the English feed, article-detail, cache-relaunch, rotation and large-text checks on both platforms. Apple/Google accounts and store submission remain separate owner-approval gates and are not required for local simulator testing.
