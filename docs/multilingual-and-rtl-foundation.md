# ILSP multilingual and RTL foundation

Status: complete local foundation; public language launch remains gated.  
Updated: 16 July 2026.

## Product decision

Israel Sports Pulse and ILSP remain the language-neutral masterbrand. Every article keeps one canonical identity and gains locale-specific child records, so adding Hebrew or another language never creates a second editorial event, a duplicate URL identity or a separate homepage ranking decision.

The first interface proof is available locally at `/he-preview`. It is intentionally unlinked from the public navigation and marked `noindex` until a full editorial translation operation and owner-approved language launch exist.

## Working files

- `data/locale-config.json` is the locale registry, fallback policy and publication gate.
- `data/content-translations.json` holds bounded locale records keyed to canonical article IDs.
- `lib/locales.ts` provides direction, fallback and Jerusalem-time formatting helpers.
- `app/he-preview/page.tsx` and its CSS module prove a responsive Hebrew reading direction without forking the product.
- `tests/localization.test.mjs` checks source freshness, canonical links and RTL hygiene.

## Translation contract

Each record requires `articleId`, `locale`, `sourceUpdatedAt`, `status`, `title`, `dek` and `category`. Full article bodies become mandatory before any locale is publicly launched; the summary-only records in the current proof cannot be routed as translated article pages.

`articleId` always resolves to the original published report. `sourceUpdatedAt` must equal the current source article timestamp. A change to the source report therefore invalidates an older translation until it is reviewed again. Translation state remains internal and must never appear in reader-facing copy.

## Editorial workflow

1. The English desk publishes or materially updates one verified canonical article.
2. The translation queue locks to that article version and preserves names, scores, competition terms and uncertainty.
3. A fluent reviewer checks idiom, sports terminology, headline meaning and all numbers against the canonical version.
4. Automated checks confirm the linked article still exists and its timestamp is unchanged.
5. Only a complete, reviewed locale version is eligible for a public route.

Machine assistance may help with a first draft, but cannot be the publication decision. Quotes must be translated from the checked source language rather than reconstructed through English when the original is available.

## Routes and fallbacks

English remains the default route. Future public locales use separate prefixes such as `/he`, with locale-specific metadata and canonicals. A missing translation must not silently mix two languages inside one article. A clearly labelled English fallback may be offered from a locale index, but the article opens on its English canonical route.

## RTL interface rules

Direction is set semantically with `lang="he"` and `dir="rtl"`. Layout code uses logical properties such as inline and block spacing instead of left/right assumptions. Scorelines, dates, player names in Latin characters and mixed numeric strings require device testing because bidirectional rendering can change punctuation order. Images remain full-frame and their visual direction must not be mirrored.

## Localisation beyond copy

Jerusalem time, Hebrew date formatting, competition names, accessibility labels, navigation order, search, social metadata and notification payloads all belong to the locale layer. Sponsor inventory and the ILSP mark remain consistent, while campaign copy may be translated independently. Analytics must compare one canonical story across locales rather than count translations as unrelated editorial output.

## Public release gate

Before Hebrew can launch publicly, ILSP needs complete article-body coverage for the promoted surface, a named fluent reviewer, corrections handling in Hebrew, translated policy pages, bidirectional mobile QA, search and social metadata tests, analytics separation and explicit owner approval. Removing `noindex`, adding public navigation or claiming ongoing Hebrew coverage is outside the current local foundation.

## Versioned mobile response boundary

The local `/api/v1/articles?locale=he` response now emits only reviewed Hebrew summary fields whose `sourceUpdatedAt` exactly matches the current canonical article version. Missing, stale or unreviewed records are omitted instead of silently mixing English and Hebrew. Translation status and source-version mechanics remain internal.

The Expo feed requests and caches summaries per locale. Because the current Hebrew records do not contain complete bodies, opening a Hebrew summary deliberately loads the canonical English detail, keeps the article text left-to-right and labels it as the full English article. This is a bounded prototype fallback, not a claim that Hebrew article publication is complete.

## Next executable work

The full-detail contract is now defined in `packages/api-contracts/schemas/article-translation.schema.json`. A `full` translation must contain at least five substantive body paragraphs, four facts, translated image alt text and an accurate translated caption, in addition to the reviewed current summary. The detail resolver rejects any missing field, insufficient array or stale source timestamp. All existing Hebrew records are explicitly `summary`, so no incomplete Hebrew body can be emitted.

Owner direction on 16 July 2026 stopped the Hebrew editorial-translation workstream: readers who want Hebrew already have the original Israeli publisher ecosystem, while ILSP's editorial purpose is English-language coverage. The existing local RTL proof remains dormant technical research only and no further Hebrew articles, summaries or public routes should be produced.

The locale architecture stays language-neutral so a different future language can be added without rebuilding article identity, caching or source-version controls. Choosing that language requires an explicit audience and commercial decision; it is not an active queue item.
