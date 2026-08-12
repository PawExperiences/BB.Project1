# Performs the automated e2e link checker release steps (thin wrapper: this
# project is a Python package, so python is already required to build and
# test it -- this delegates to release.py to avoid duplicating release logic
# across three languages).
#
# When to run: after all bundled tasks for a release are merged to the
# release branch and the runbook's manual steps up to 'Tag the release'
# are complete.
#
# Usage: release/scripts/release.ps1 [-Version <version>]
# Env (optional): RELEASE_BRANCH (default: main), RELEASE_NOTES_FILE
# -- both are read directly by release.py.

param(
    [string]$Version
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target = Join-Path $ScriptDir "release.py"
Write-Host "delegating to: python $Target $Version"

if ($Version) {
    python $Target $Version
} else {
    python $Target
}
exit $LASTEXITCODE
