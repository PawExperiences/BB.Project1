#!/usr/bin/env bash
# build_artifact.sh
# Packages the JavaScript game files into dist/build.zip.
# Usage: bash scripts/build_artifact.sh

set -euo pipefail

JS_FILES=(
  boss.js
  collision.js
  explosion.js
  game.js
  gameConfig.js
  input.js
  invaders.js
  level1.js
  level2.js
  level3.js
  player.js
)

mkdir -p dist

# Remove any previous build.zip so we always produce a fresh artifact
rm -f dist/build.zip

zip dist/build.zip "${JS_FILES[@]}"

echo "Artifact created: dist/build.zip"
