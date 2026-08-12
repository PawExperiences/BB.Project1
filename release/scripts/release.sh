#!/bin/sh
# Performs the automated e2e link checker release steps (thin wrapper: this
# project is a Python package, so python3 is already required to build and
# test it -- this delegates to release.py to avoid duplicating release logic
# across three languages).
#
# When to run: after all bundled tasks for a release are merged to the
# release branch and the runbook's manual steps up to 'Tag the release'
# are complete.
#
# Usage: release/scripts/release.sh [version]
# Env (optional): RELEASE_BRANCH (default: main), RELEASE_NOTES_FILE
# -- both are read directly by release.py.

set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
echo "delegating to: $SCRIPT_DIR/release.py $*"
exec python3 "$SCRIPT_DIR/release.py" "$@"
