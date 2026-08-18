#!/bin/sh
# run.sh -- start Space Invaders 0.1.0.
#
# WHAT IT DOES: opens the game's index.html in the default web browser via
# a file:// URL (xdg-open on Linux, open on macOS, cmd start on Windows
# Git Bash / MSYS). The game is fully static -- no server, no build step,
# no dependencies.
#
# WHEN TO RUN: any time you want to play or smoke-test the released game:
#   sh release/scripts/run.sh

set -u

ROOT=$(CDPATH= cd "$(dirname "$0")/../.." && pwd)
INDEX="$ROOT/index.html"

if [ ! -f "$INDEX" ]; then
  echo "ERROR: index.html not found at $INDEX"
  echo "Run this script from a checkout (or unpacked zip) of the release."
  exit 1
fi

echo "Opening $INDEX in the default browser ..."
case "$(uname -s 2>/dev/null || echo unknown)" in
  Darwin*)
    open "$INDEX"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    if command -v cygpath >/dev/null 2>&1; then
      cmd //c start "" "$(cygpath -w "$INDEX")"
    else
      cmd //c start "" "$INDEX"
    fi
    ;;
  *)
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$INDEX"
    else
      echo "No opener found - open this file in your browser manually:"
      echo "  $INDEX"
    fi
    ;;
esac

echo "Controls: ENTER = start/advance scene, Arrow keys or A/D = move, Space = fire."
