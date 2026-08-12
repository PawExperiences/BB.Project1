# Serves the built standup-poster app using Vite's preview server.
# Run this AFTER `npm run build` has produced dist/, to smoke-test the
# production build locally before/after release.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "../..")
Set-Location $RepoRoot

$Port = $env:PORT
if (-not $Port) { $Port = "4173" }

if (-not (Test-Path "dist/index.html")) {
    Write-Error "dist/index.html not found. Run 'npm ci; npm run build' first."
    exit 1
}

Write-Output "-- Serving dist/ with 'vite preview' on port $Port --"
npx vite preview --outDir dist --port $Port
