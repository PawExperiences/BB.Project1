# run.ps1 — serve the game locally on http://localhost:8080. Run from repo root.
$ErrorActionPreference = 'Stop'

$PORT = 8080
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '../..')

Set-Location $RepoRoot
Write-Host "Serving e2e Space Invaders from: $RepoRoot"
Write-Host "Open: http://localhost:$PORT/index.html"
Write-Host 'Press Ctrl+C to stop.'

# Use Python 3 to serve
$python = Get-Command python3 -ErrorAction SilentlyContinue
if (-not $python) { $python = Get-Command python -ErrorAction SilentlyContinue }
if (-not $python) {
    Write-Error 'Python is required to run the dev server.'
    exit 1
}

& $python.Source -m http.server $PORT
