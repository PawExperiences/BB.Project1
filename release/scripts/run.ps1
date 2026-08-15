# Open the built e2e-space-invaders-cc game directly from disk (file://),
# matching the project's no-server, no-build-step design. Idempotent: just
# opens a browser tab, no state is changed.
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$IndexHtml = Join-Path $RepoRoot "index.html"

if (-not (Test-Path $IndexHtml)) {
    Write-Error "ERROR: $IndexHtml not found. Run this from a checkout that contains index.html."
    exit 1
}

Write-Host "Opening $IndexHtml in the default browser (file:// -- no server needed)"
Start-Process $IndexHtml
