#!/bin/sh
# Copies the shared engine and the canonical motion engine into every part.
# Source of truth: shared/ (engine) and the installed system-animation skill
# (motion). Run after editing anything in shared/.
# Fonts, UI icons and the character media every part shares are NOT copied:
# they live once in unit-assets/ and the parts reference ../unit-assets/…
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOTION="${MOTION_ENGINE:-$HOME/.claude/skills/system-animation/engine}"
for P in "$ROOT"/methodica-ar-science-mass-gas-01-*/; do
  P="${P%/}"; N="${P##*-}"
  mkdir -p "$P/css" "$P/js"
  cp "$ROOT/shared/engine.css" "$P/css/engine.css"
  cp "$ROOT/shared/engine.js"  "$P/js/engine.js"
  if [ -d "$MOTION" ]; then
    cp "$MOTION/motion.css" "$P/css/motion.css"
    cp "$MOTION/motion.js"  "$P/js/motion.js"
  else
    echo "WARN: motion engine not found at $MOTION" >&2
  fi
  sed "s|<title>.*</title>|<title>DEV — حجم الغاز · الجزء $N</title>|" "$ROOT/shared/index_dev.template.html" > "$P/index_dev.html"
  echo "synced part $N"
done
# Drift check: every part's copy must match shared/
for P in "$ROOT"/methodica-ar-science-mass-gas-01-*/; do
  cmp -s "$ROOT/shared/engine.js" "$P/js/engine.js" && cmp -s "$ROOT/shared/engine.css" "$P/css/engine.css" || { echo "DRIFT in $P" >&2; exit 1; }
done
echo "OK — no drift"
