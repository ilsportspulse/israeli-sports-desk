# First two partner routes — fail-closed submission preflight

Checked: 17 July 2026, 06:00 Asia/Jerusalem  
Visibility: internal  
External actions: none

## Result

The AWS Activate and Maccabi World Union preparation packs pass the local preflight and remain inactive. The check does not approve an account, application, recipient, message, attachment, domain, purchase or submission.

The validator confirms that the USD 30,000 twelve-month founding-partner anchor remains separate from both first routes. AWS remains an infrastructure-credit application with a USD 2,110 planning forecast. Maccabi World Union remains an eight-week non-cash pilot with no exclusivity, editorial approval or subscriber-level data sharing.

## Fail-closed controls

`npm run partners:validate` checks:

- both qualified prospect records exist, have HTTPS route evidence and retain `ownerApprovalRequired: true`;
- qualification and route-research dates for both qualified routes and all three held routes remain within a 31-day freshness window;
- AWS and Maccabi statuses remain explicitly pending owner approval;
- seven hard-stop placeholders remain in the submission drafts for the production URL, domain email, account ID, recipient, sender, ILSP email and website;
- all twelve cells in the two-route decision table remain `[PENDING]` and none is pre-approved;
- the owner must perform the AWS submission and separately authorise the Maccabi message;
- Bank Hapoalim, Bank Leumi and yes remain on hold until a legitimate commercial route exists;
- the founding-partner price, AWS planning forecast and non-cash pilot position remain consistent across the decision brief, drafts, one-page brief and consistency record.

Mutation tests remove a required placeholder, disable the AWS owner gate and age the AWS evidence beyond 31 days. All altered packs are rejected, proving the check fails closed rather than only describing the intended policy.

Each successful run also writes `data/partner-submission-readiness.json`. This internal snapshot lists the five qualified or held routes, their evidence dates, exact expiry timestamps, remaining days, owner gates and official route/evidence URLs. It turns the 31-day rule into an executable refresh queue without opening an account, application or message.

## Owner decision still required

No route can progress externally until the owner confirms the company facts, recipient or account, sender identity, website and mailbox, exact ask and attachment set, final text and the specific submission or send action. An approval for one route does not authorise the other.

## Next executable action

Keep the preflight green after any price, forecast, scope, recipient, placeholder, status or evidence-date change. Refresh the official route research when the 31-day window expires. The next non-local step is an owner decision; the automation must not replace it with guessed facts or an external action.
