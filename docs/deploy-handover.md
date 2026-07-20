# ILSP production deploy — handover & one-time auth

Primary domain: **ilsportspulse.com** (owned, EasyHost, 20 Jul 2026).
Stack: Next.js site on **Vercel**, **Cloudflare** in front (DNS + SSL + WAF/DDoS), content in a **private GitHub repo**. AI newsroom keeps running on an always-on box and pushes verified articles to the repo; Vercel redeploys automatically.

The only steps that need Patrick are: (a) creating the three accounts, and (b) a one-time authentication per service. After that, Claude runs all deploys with the resulting tokens/sessions — no password is ever typed by Claude.

---

## Step 1 — GitHub (content + backup)
1. Create a **private** repo, e.g. `ilsp/israeli-sports-desk`.
2. One-time auth on the machine (device-code flow, ~30s):
   ```
   gh auth login          # choose GitHub.com → HTTPS → login with a web browser
   ```
3. Tell Claude the repo URL. Claude then does the initial push and all future pushes.
   - Every article change is a commit → full history = your backup, nothing is lost.

## Step 2 — Vercel (website hosting)
1. Sign up at vercel.com (log in **with GitHub** — no separate password).
2. One-time auth:
   ```
   npm i -g vercel
   vercel login          # opens browser once
   ```
3. Claude links the repo and runs `vercel deploy` (preview) then, on your go, `vercel --prod`.
   - Free/Hobby tier is enough to start; upgrade to Pro (~$20/mo) only if traffic needs it.

## Step 3 — Cloudflare (DNS + security, free)
1. Sign up at cloudflare.com, **Add a site** → `ilsportspulse.com`.
2. Cloudflare shows two **nameservers**. At **EasyHost**, set the domain's nameservers to those two. (This is the one change at EasyHost; propagation minutes–24h.)
3. Create a scoped **API token**: My Profile → API Tokens → Create Token → template **Edit zone DNS**, zone = ilsportspulse.com. Paste that token to Claude.
4. Claude sets the DNS records below and enables the security settings.

### DNS records Claude will set (once the API token exists)
| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `@` (ilsportspulse.com) | `cname.vercel-dns.com` | Proxied (orange) |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied |
| TXT | `@` | Vercel domain-verification value (shown in Vercel) | — |
| MX / SPF / DKIM / DMARC | for mail | set when the mailbox provider is chosen | — |

Security defaults Claude will enable: Always Use HTTPS, TLS 1.2+, WAF managed rules, bot-fight mode, and DNSSEC (activated at EasyHost with the value Cloudflare provides).

## Step 4 — Go-live (the one step Claude confirms first)
Pointing the public domain live is the single irreversible, outward-facing action. Claude will stage everything to a preview URL first, show it to you, and only flip `ilsportspulse.com` to production after your explicit go — keeping you founder-anonymous (WHOIS privacy on, no personal data in DNS/registrant).

## Email (news@ / corrections@ / rights@ ilsportspulse.com)
Not on the web host. Use a mail provider (e.g. Zoho Mail free tier, or Cloudflare Email Routing to forward to an inbox you control). Claude will add the SPF/DKIM/DMARC records once you pick one.

---

### What Claude does vs what you do
- **You (once, from any device):** create the 3 accounts, run the one-time `gh auth login` / `vercel login`, generate the Cloudflare API token, set nameservers at EasyHost.
- **Claude (ongoing, with tokens/sessions):** every push, build, preview and production deploy; all DNS records; security config; keeping the newsroom publishing to the repo.
- **Claude never:** types your raw passwords, enters payment, or flips the public domain live without your explicit go for that step.
