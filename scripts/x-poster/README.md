# ILSP → X auto-poster (free, browser-based, no API)

Posts the newest **Israeli** stories from ilsportspulse.com to **@ilsportspulse**
automatically — using a logged-in Chromium profile, **no X API and no credits**.

- Reads the live RSS feed, keeps Israeli-desk stories, newest first.
- Skips anything already tweeted (state file `~/.ilsp-x-posted.json`).
- Posts a small **paced** batch each run so the account never looks like a spam bot.
- A launchd job runs it every 30 min → seeds the backlog over a day or two, then
  keeps up with each new article on its own.

Defaults: **4 posts / run**, **20 / day max**, **60 s** between posts. Tune in the plist.

---

## Setup (once, on the always-on Mac — the iMac)

Everything runs where you log in once. Run these on that machine:

```bash
cd ~/ilsp/project/israeli-sports-desk

# 1. Log into X once (a browser window opens — sign in as @ilsportspulse)
node scripts/x-login.mjs

# 2. Test one run by hand (watch it, headed)
X_HEADLESS=0 X_MAX_PER_RUN=1 node scripts/x-auto-post.mjs

# 3. Install the every-30-min scheduler
cp scripts/x-poster/com.ilsp.xposter.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.ilsp.xposter.plist
```

That's it. Step 1 is the **only** thing that needs your hands.

## Watch / control it

```bash
tail -f ~/.ilsp-x-post.log                 # what it posted
launchctl list | grep xposter              # is it scheduled?
launchctl unload ~/Library/LaunchAgents/com.ilsp.xposter.plist   # pause
launchctl load   ~/Library/LaunchAgents/com.ilsp.xposter.plist   # resume
```

## If it stops posting

Almost always X logged the profile out. Re-run `node scripts/x-login.mjs`.
The log will say `Profile not logged in` when that happens.

## Notes

- **Volume is deliberately capped.** Blasting 50 tweets at once from a fresh account
  is the fastest way to get it suspended. The drip is the point.
- To temporarily go faster (e.g. clear the backlog), raise `X_MAX_PER_DAY` in the plist
  and reload. Don't leave it high.
- State lives in `~/.ilsp-x-posted.json`; delete an entry to allow a re-post.
