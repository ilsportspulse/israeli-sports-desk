#!/usr/bin/env bash
# One-shot setup for the ILSP X auto-poster on this machine.
# Installs Playwright Chromium, writes+loads the launchd job (auto-detecting the
# node path and repo location), and leaves ONE manual step: the X login.
#
# Run from the repo:  bash scripts/x-poster/setup-imac.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
NODE="$(command -v node)"
PLIST="$HOME/Library/LaunchAgents/com.ilsp.xposter.plist"
NODEDIR="$(dirname "$NODE")"

echo "→ repo:  $REPO"
echo "→ node:  $NODE"

echo "→ Ensuring Playwright Chromium is installed (first run may download ~150MB)…"
( cd "$REPO" && npx playwright install chromium ) || echo "  (playwright install skipped/failed — will still try)"

mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.ilsp.xposter</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>$REPO/scripts/x-auto-post.mjs</string></array>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>$NODEDIR:/usr/local/bin:/usr/bin:/bin</string>
    <key>X_MAX_PER_RUN</key><string>4</string>
    <key>X_MAX_PER_DAY</key><string>20</string>
    <key>X_MIN_GAP_SEC</key><string>60</string>
  </dict>
  <key>StartInterval</key><integer>1800</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$HOME/.ilsp-x-launchd.log</string>
  <key>StandardErrorPath</key><string>$HOME/.ilsp-x-launchd.err.log</string>
</dict></plist>
PL

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo
echo "✓ Launchd job installed & loaded (runs every 30 min; harmless no-op until you log in)."
echo
echo "──────────────────────────────────────────────"
echo "  LAST STEP (only you can do this):"
echo "     node scripts/x-login.mjs"
echo "  A browser opens → log in as @ilsportspulse → done."
echo "  After that it posts automatically. Watch it: tail -f ~/.ilsp-x-post.log"
echo "──────────────────────────────────────────────"
