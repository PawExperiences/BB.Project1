# Serve the built static game (index.html, game.js, etc.) over HTTP for local testing.
$ErrorActionPreference = "Stop"

$Port = $env:PORT
if (-not $Port) { $Port = 8000 }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent (Split-Path -Parent $ScriptDir)

if (-not (Test-Path (Join-Path $Root "index.html"))) {
    $Root = Get-Location
}

Set-Location $Root
Write-Host "serving $Root at http://127.0.0.1:$Port/index.html (Ctrl+C to stop)"
Write-Host "the game also runs directly via file://$Root/index.html"

$pythonCmd = Get-Command python3 -ErrorAction SilentlyContinue
if (-not $pythonCmd) { $pythonCmd = Get-Command python -ErrorAction SilentlyContinue }

if ($pythonCmd) {
    & $pythonCmd.Source -m http.server $Port --bind 127.0.0.1
} else {
    Write-Error "python3 or python is required to serve the game locally"
    exit 1
}
