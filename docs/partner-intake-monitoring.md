# ILSP held-partner intake monitoring

Status date: 16 July 2026  
Visibility: internal research only. Monitoring creates no permission to contact an organisation.

## Purpose

Bank Hapoalim, Bank Leumi and yes remain plausible commercial partners, but none currently publishes a legitimate unsolicited sponsorship or media-partnership intake. This record turns that hold into a bounded monitoring process. It prevents repeated open-ended research and makes the exact promotion trigger explicit.

## Monitoring rules

| Target | Official locations to monitor | Positive signal | Check cadence | Promotion trigger | Routes that never qualify |
|---|---|---|---|---|---|
| Bank Hapoalim | Bank organisation profile; current ESG/procurement publication | A public marketing, procurement or supplier intake that explicitly accepts commercial media, sponsorship or advertising proposals | Monthly, and after a new annual ESG/procurement publication | Move from hold to route-qualified only when the bank publishes an intake URL, named commercial function and submission conditions | Community banking, donations, press, investor relations and generic customer service |
| Bank Leumi | ESG hub; current supplier code; procurement classification | A public supplier or marketing-procurement intake whose scope includes advertising, media or sponsorship inventory | Monthly, and when the supplier code or ESG procurement material changes | Move from hold only when an open commercial intake and its eligibility rules are visible on an official Leumi page | Donations committee, press, investor relations and retail banking support |
| yes | Bezeq Group annual reporting and official commercial/business pages | A yes or Bezeq Group marketing/business-development route that accepts media partnerships, connected-TV campaigns or sponsorship proposals | Monthly, and after a material corporate-site navigation change | Move from hold only when the recipient function and permitted proposal type are both explicit | Supplier login, B2B reseller programme, subscriber sales, technical support and customer service |

## Change-control procedure

1. Save the official URL and the date on which the qualifying language first appeared.
2. Record the relevant business function, eligibility rules, submission method and any rights or exclusivity conditions.
3. Confirm that the path accepts unsolicited commercial proposals rather than existing suppliers, resellers, charities or customers.
4. Update `data/partner-prospects.json`, this record, `docs/project-board.md` and `data/project-progress.json` together.
5. Keep all outreach blocked until the owner approves the recipient, ask, sender identity and attachments.

## Fail-closed maintenance gate

Run `npm run partners:intake:validate` after any monitoring or prospect-record change. The local preflight requires exactly the three approved held targets, matching prospect statuses and evidence dates, at least two official HTTPS records per target, a 31-day evidence window, the known false-route exclusion for each organisation, owner approval before promotion and zero external actions. It writes the current evidence age and earliest expiry back to the internal monitoring record; stale evidence, a removed false-route exclusion or an authority bypass makes the check fail.

## Baseline result

The 16 July 2026 baseline remains hold for all three organisations. Bank Hapoalim and Bank Leumi have verified internal procurement/marketing functions but no public unsolicited intake. The known Bezeq supplier portal and B2B reseller programme are explicitly excluded for yes. The monitor is intentionally checked only on its monthly cadence, on official material change or before its recorded evidence expiry. No messages, applications or account actions were made.
