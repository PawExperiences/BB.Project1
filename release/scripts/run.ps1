# run.ps1 — starts a local HTTP server on port 8080 serving the repo root.
# Use when testing over http:// (e.g. DevTools profiling); file:// still works without this.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Port = 8080
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir '../..')
Write-Host "Serving e2e space invaders from: $(Get-Location)"
Write-Host "Open http://localhost:$Port/index.html in your browser."
Write-Host 'Press Ctrl+C to stop.'
& python3 -m http.server $Port
