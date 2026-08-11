# Serve the built quote page locally for manual verification.
# Builds the site if dist/index.html is missing, then runs `astro preview` to serve dist/.
# Run this after release.ps1, or any time you want to eyeball the built page before shipping.

$ErrorActionPreference = "Stop"

$DistDir = "dist"
$HostName = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$Port = if ($env:PORT) { $env:PORT } else { "4321" }

$IndexHtml = Join-Path $DistDir "index.html"
if (-not (Test-Path $IndexHtml)) {
    Write-Host "$IndexHtml not found; building first."
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
}

Write-Host "-- Serving $DistDir at http://$HostName`:$Port (Ctrl+C to stop) --"
npx astro preview --host $HostName --port $Port
