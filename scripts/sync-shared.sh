#!/bin/sh
# Copies the shared engine, fonts, UI icons and the canonical motion engine
# into every part. Source of truth: shared/ (engine) and the installed
# system-animation skill (motion). Run after editing anything in shared/.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOTION="${MOTION_ENGINE:-$HOME/.claude/skills/system-animation/engine}"
for P in "$ROOT"/methodica-science-mass-gas-01-*/; do
  P="${P%/}"; N="${P##*-}"
  mkdir -p "$P/css" "$P/js" "$P/assets/fonts" "$P/assets/img"
  cp "$ROOT/shared/engine.css" "$P/css/engine.css"
  cp "$ROOT/shared/engine.js"  "$P/js/engine.js"
  cp "$ROOT"/shared/fonts/*.ttf "$P/assets/fonts/"
  cp "$ROOT"/shared/ui/*        "$P/assets/img/"
  if [ -d "$MOTION" ]; then
    cp "$MOTION/motion.css" "$P/css/motion.css"
    cp "$MOTION/motion.js"  "$P/js/motion.js"
  else
    echo "WARN: motion engine not found at $MOTION" >&2
  fi
  sed "s|<title>.*</title>|<title>DEV — נפח של גז · חלק $N</title>|" "$ROOT/shared/index_dev.template.html" > "$P/index_dev.html"
  echo "synced part $N"
done
# Drift check: every part's copy must match shared/
for P in "$ROOT"/methodica-science-mass-gas-01-*/; do
  cmp -s "$ROOT/shared/engine.js" "$P/js/engine.js" && cmp -s "$ROOT/shared/engine.css" "$P/css/engine.css" || { echo "DRIFT in $P" >&2; exit 1; }
done
echo "OK — no drift"
