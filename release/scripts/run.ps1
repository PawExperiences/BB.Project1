# Run script for e2e standup poster.
# Builds the app if needed, then serves the built dist/ folder locally
# via 'vite preview' so a maintainer can smoke-test the release artifact.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
Set-Location $RepoRoot

if (-not $env:PORT) { $env:PORT = "4173" }

$IndexHtml = Join-Path $RepoRoot "dist\index.html"
if (-not (Test-Path $IndexHtml)) {
    Write-Host "dist/index.html not found, building first"
    Write-Host "+ npm ci"
    npm ci
    Write-Host "+ npm run build"
    npm run build
}

Write-Host "== Serving dist/ at http://localhost:$($env:PORT) (Ctrl+C to stop) =="
Write-Host "+ npx --yes vite preview --outDir dist --port $($env:PORT)"
npx --yes vite preview --outDir dist --port $env:PORT
