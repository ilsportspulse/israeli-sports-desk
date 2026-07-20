# ILSP governance launch checklist

Status: local policy implementation complete; external activation still requires owner and professional review.

## Public policy surfaces

- `/corrections` — correction scope, change labelling, review process and editorial independence.
- `/privacy` — data categories, purposes, service providers, reader choices and journalistic records.
- `/terms` — informational-use limits, permitted reuse, third-party rights and service availability.
- `/commercial-independence` — editorial firewall, sponsorship labelling, conflicts and partner review.

All four routes are linked permanently from the newsroom footer and share the same mobile-responsive policy index.

## Maintenance check — 17 July 2026

The current local policy surfaces, footer links and published contact-address references pass their consistency check. `data/governance-activation-status.json` records the result in a release-readable form. The standalone `npm run governance:validate` preflight now fails closed on a missing route or footer link, an inbox treated as active without owner evidence, an expired local audit, stale browser evidence or any policy-route rendering defect.

| Check | Result | Release meaning |
|---|---|---|
| Four route files and permanent footer links | Pass locally | Keep in regression tests |
| Shared responsive governance layout | Pass locally | Repeat against the production build before launch |
| Corrections, privacy, legal and partnerships addresses appear in the intended policy | Pass for copy consistency | Delivery, recovery control and ownership remain unverified |
| Domain, entity, jurisdiction and provider details | Open | Blocks a production-ready policy claim |
| Professional legal and privacy review | Open | Blocks deployment |
| Browser acceptance | All eight policy-route scenarios return 200 at 390px and 1440px with no document-level horizontal overflow, missing local resources or empty stylesheet | Refresh within 24 hours of release review and repeat against the production build |

The release rule is fail-closed: none of the four addresses may be treated as operational, and the policy set may not be marked launch-ready, until owner-controlled evidence is recorded for the matching prerequisite. A different final domain requires every address reference to be changed before release.

The browser acceptance result verifies only local rendering and permanent route availability. It does not activate the listed mailboxes, establish legal sufficiency or replace professional review.

## Required before public launch

1. Register and secure owner-controlled mailboxes for `corrections@ilsportspulse.com`, `privacy@ilsportspulse.com`, `legal@ilsportspulse.com` and `partnerships@ilsportspulse.com`.
2. Replace or remove every address if the final public domain differs from `ilsportspulse.com`.
3. Obtain professional legal review for the operating entity, governing law, privacy jurisdiction, retention schedule and consent requirements.
4. Inventory the actual production providers for hosting, analytics, email, security, scores, advertising and payments; name providers where legally required.
5. Configure a tested correction-request workflow with ownership, acknowledgement target, escalation and publication-note rules.
6. Verify that consent banners and preference controls match the trackers actually loaded in production.
7. Approve a public effective date and keep versioned copies of every policy revision.

## Authority boundary

No mailbox, legal relationship, production tracker or external account has been created by this local work. The pages express the intended operating standard and remain subject to owner approval and professional legal review before deployment.
