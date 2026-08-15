# Starts the built e2e ticket mirror app with `next start` (run `npm run build` first).
$ErrorActionPreference = "Stop"

$Port = if ($env:PORT) { $env:PORT } else { "3000" }

if (-not (Test-Path ".next")) {
    Write-Host "No .next build found. Run 'npm run build' (or release/scripts/release.ps1) first."
    exit 1
}

Write-Host "Starting e2e ticket mirror on port $Port ..."
npx --yes next start -p $Port
