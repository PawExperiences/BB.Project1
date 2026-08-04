# run.ps1 - serve e2e Space Invaders on localhost:8080 and open in browser.
# Usage: .\release\scripts\run.ps1 [-Port 8080]
param(
    [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = (Resolve-Path (Join-Path $ScriptDir '..\..') ).Path

Write-Host "Serving $RepoRoot on http://localhost:$Port"
Write-Host "Opening http://localhost:$Port/index.html ..."

Start-Process "http://localhost:$Port/index.html"

Set-Location $RepoRoot
python -m http.server $Port
