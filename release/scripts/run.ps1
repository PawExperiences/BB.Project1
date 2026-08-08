# run.ps1 — Serve the game locally on port 8080 and open in the default browser.
# Run from the repository root. Opens http://localhost:8080/index.html.
# This is optional: the game also works directly via a file:// URL.

$ErrorActionPreference = 'Stop'

$Port = 8080
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..' '..')).Path
$Url = "http://localhost:$Port/index.html"

try { python3 --version | Out-Null } catch {
    Write-Error '[error] python3 is required to run the local server.'
    exit 1
}

Write-Host "[run] Serving from $RepoRoot on $Url"
Write-Host '[run] Press Ctrl+C to stop.'

Set-Location $RepoRoot
Start-Process $Url
python3 -m http.server $Port
