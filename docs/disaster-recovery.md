# ILSP — security hardening & disaster-recovery runbook

An Israel-linked sports news site is a guaranteed target (DDoS, defacement, credential-stuffing, scraping, bot abuse). Security and backups are treated as **P1 foundation**.

## Why the architecture already helps

- **Public site is static/SSR on Vercel's global edge CDN** — no origin database to hack for the reading experience; the last good deploy keeps serving even if a build fails or origin is unreachable.
- **All content lives in git** — every change is an immutable, timestamped version; defacement or a bad edit is undone with a one-click revert + redeploy (minutes).

## Edge protection (Cloudflare — recommended, P1)

Put Cloudflare in **proxy mode** in front of `ilsportspulse.com`:

- WAF managed rules, **DDoS mitigation**, rate limiting, bot-fight mode.
- **"Under Attack" mode** toggle for incidents.
- Geo/ASN rules; challenge suspicious traffic.
- Hide the Vercel origin behind Cloudflare so the WAF can't be bypassed.
- Force **HTTPS + HSTS** (HSTS is already sent by the app).

## Security headers

Sent on every response (see `next.config.mjs`): HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. The admin adds `X-Frame-Options: DENY` + `noindex`.

**Full CSP** (roll out via Cloudflare in report-only first, then enforce — kept out of the app config so live embeds aren't broken during tuning):

```
default-src 'self';
img-src 'self' data: https:;
media-src 'self' https:;
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
frame-src https://www.youtube.com https://platform.twitter.com https://www.instagram.com https://t.me;
connect-src 'self';
font-src 'self' data:;
object-src 'none'; base-uri 'self'; frame-ancestors 'none';
```

## Backoffice hardening

- **2FA (TOTP)** available for admin sign-in (Access & security).
- Login **rate-limiting + lockout**; signed HttpOnly/SameSite session cookies; short TTL.
- `/admin` is `noindex` + framing-denied; all admin APIs are auth-gated with a role/capability model.
- **Full audit log** of every create/edit/publish/delete/sign-in.
- Secrets only as encrypted env vars (Vercel/GitHub) — **never in the repo**. Rotate tokens periodically; use scoped tokens.
- Dependency scanning via `npm audit` / Dependabot.

## Backups — many, layered

1. **Git history** — continuous versioned backup of all content + code (primary).
2. **Off-site mirror** — `.github/workflows/mirror.yml` pushes the whole repo to a second remote daily (set `MIRROR_REMOTE_URL`), so a GitHub compromise ≠ data loss.
3. **Scheduled content snapshot** — `npm run backup` (also in the mirror workflow) bundles all data + a media manifest into `backups/ilsp-backup-<stamp>.json`, uploaded as a 90-day artifact; ship to encrypted off-site object storage.
4. **Media** — served from git/`public/`; back up to versioned object storage off-site.
5. **Database** (once added for hot data) — automated snapshots + point-in-time recovery + off-site copy.

## Disaster-recovery procedure

1. **Defacement / bad deploy** → in Vercel, **promote the last good deployment** (instant rollback), or `git revert` the offending commit and redeploy.
2. **Under attack** → enable Cloudflare **Under Attack** mode; rate-limit/geo-block; rotate any exposed keys.
3. **Content loss** → restore from git; if git is compromised, restore from the off-site mirror or the latest snapshot artifact, then redeploy.
4. **Credential compromise** → rotate `GITHUB_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`, admin password + `ADMIN_SESSION_SECRET`, disable/re-enroll 2FA.

Restore = redeploy from git → live in minutes.

## Monitoring (P2)

Uptime + anomaly alerts, error tracking (Sentry), Cloudflare traffic analytics, log retention. Incident playbook: Under-Attack mode → revert to last good deploy → rotate keys.
