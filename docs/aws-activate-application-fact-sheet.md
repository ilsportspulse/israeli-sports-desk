# Israel Sports Pulse — AWS Activate application fact sheet

Status date: 16 July 2026  
Visibility: internal preparation only. This document does not authorise an application, account creation or purchase.

## Application route

**Programme:** AWS Activate Founders — self-funded route  
**Official application page:** https://aws.amazon.com/startups/credits/  
**Controlled ask:** the available Founders credit package for eligible self-funded startups, beginning with USD 1,000; AWS states that selected participants may qualify for additional credits up to USD 5,000.  
**Decision owner:** AWS Activate application review.

AWS currently lists the general eligibility conditions as pre-Series B, founded within the last ten years, an AWS account on a paid-tier plan, and either new to Activate Credits or requesting a higher credit tier than previously received. The Founders route is for bootstrapped or self-funded startups. Programme rules and credit coverage must be checked again on the submission date.

## Company profile for the form

| Field | Prepared answer | Gate before submission |
|---|---|---|
| Company name | Israel Sports Pulse | Confirm legal trading name |
| Short name | ILSP | None |
| Founded | 2026 | Confirm legal incorporation date if different |
| Funding stage | Self-funded / pre-revenue | Owner confirmation |
| Institutional funding | None currently planned or recorded | Owner confirmation |
| Product category | Digital sports media, live-sports utility and audience engagement | None |
| Primary market | English-reading audiences in Israel and Israel-connected communities worldwide | None |
| Company website | Production domain not yet registered | Working public website required |
| Professional email | Not yet configured | Domain mailbox with SPF, DKIM and DMARC required |
| AWS Builder ID | Not created for ILSP | Owner-controlled creation required |
| AWS account | Not created or linked for ILSP | Owner-controlled paid-tier account and account ID required |
| Prior Activate credits | None recorded | Owner must confirm |

## Application description

Israel Sports Pulse is building a mobile-first English sports publication covering Israeli leagues, national teams, athletes abroad and major international events. The working product combines a professionally gated newsroom, a developing match centre, original analysis, a daily Israeli-sport quiz and a permanent historical archive. AWS infrastructure would support scheduled source processing, application delivery, licensed media storage, structured sports data, monitoring, backups and future multilingual services.

## Planned AWS workload

This is a provisional launch architecture, not a claim about the current local preview.

- **Application runtime:** AWS App Runner or ECS on Fargate for the Next.js application and internal workers, selected after a small cost and operations test.
- **Scheduled processing:** EventBridge and Lambda or container tasks for permitted source discovery, integrity checks and data refreshes.
- **Structured data:** RDS for PostgreSQL or Aurora Serverless v2 after comparing minimum cost, pause behaviour, backup and migration requirements.
- **Media and archive:** S3 with lifecycle controls for licensed images, generated assets, backups and durable archive storage.
- **Delivery and security:** CloudFront, Route 53, AWS Certificate Manager and a narrowly configured AWS WAF if justified by launch traffic.
- **Operations:** CloudWatch, AWS Budgets, cost-allocation tags, Secrets Manager and automated backup validation.
- **Later evaluation only:** SES for opt-in email and managed translation or AI services where privacy, copyright and cost controls are satisfied.

The architecture must remain portable. Article, score and media records need documented export paths so startup credits do not create a migration trap.

## Twelve-month usage forecast

Planning estimate only; it is not an AWS quote. The professional funding model currently allows approximately USD 150 per month for hosting, database, storage and backups. The forecast adds a controlled launch buffer as traffic and scheduled processing grow.

| Month | Planned stage | Forecast eligible AWS usage |
|---:|---|---:|
| 1 | Private production environment, budgets and backups | USD 85 |
| 2 | Protected partner preview and monitoring | USD 95 |
| 3 | Public launch readiness and media migration | USD 110 |
| 4 | Initial public traffic and scheduled workers | USD 130 |
| 5 | Score-provider integration and cache tuning | USD 145 |
| 6 | Newsletter and engagement instrumentation | USD 160 |
| 7 | Expanded archive and Israeli competition coverage | USD 180 |
| 8 | Match-centre traffic and resilience testing | USD 200 |
| 9 | First multilingual technical foundation | USD 220 |
| 10 | Mobile API preparation | USD 240 |
| 11 | Seasonal peak buffer | USD 260 |
| 12 | Production optimisation and renewal decision | USD 285 |
|  | **Twelve-month planning total** | **USD 2,110** |

The credit application should be timed close to production readiness so the usable period is not consumed by an unfinished launch. Every non-credit charge needs an owner-approved budget alarm and a monthly cost review.

## Evidence to attach or retain

- Production website showing the working product and company identity.
- Concise product screenshot set and founding-partner brief.
- Twelve-month usage forecast from this fact sheet.
- Current funding model and architecture decision record.
- Owner confirmation of founding date, funding stage, previous credits and company details.

## Submission checklist

- [ ] Owner approves applying and confirms every company-profile answer.
- [ ] Production domain and functional website exist.
- [ ] Professional ILSP email is authenticated.
- [ ] AWS Builder ID and paid-tier account are owner controlled.
- [ ] Billing alerts, MFA and least-privilege access are configured before workloads move.
- [ ] Current AWS programme terms, eligible services and credit expiry are reviewed.
- [ ] Owner submits the application; automation does not press submit.

## Sources

- AWS Activate Credits: https://aws.amazon.com/startups/credits/
- AWS explanation of Activate credits and exclusions: https://aws.amazon.com/startups/learn/everything-you-need-to-know-about-aws-activate-credits

