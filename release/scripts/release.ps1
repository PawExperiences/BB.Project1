# Automated release script for e2e quote page.
# Builds the site, tags the release, and publishes a GitHub release with the dist artifact.
# Run from the repository root after CI is green on the release commit.

$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$DistDir = "dist"
$ArchiveName = "dist-$Tag.zip"

Write-Host "== Release $Tag =="

Write-Host "-- Installing dependencies (npm ci) --"
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

Write-Host "-- Building site (npm run build) --"
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

$IndexHtml = Join-Path $DistDir "index.html"
if (-not (Test-Path $IndexHtml)) {
    throw "ERROR: $IndexHtml was not produced by the build."
}
Write-Host "$IndexHtml built successfully."

git rev-parse -q --verify "refs/tags/$Tag" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists locally; skipping tag creation."
} else {
    Write-Host "-- Tagging release $Tag --"
    git tag -a $Tag -m "Release $Tag"
    git push origin $Tag
}

Write-Host "-- Archiving $DistDir --"
if (Test-Path $ArchiveName) { Remove-Item -Force -Confirm:$false $ArchiveName }
Compress-Archive -Path (Join-Path $DistDir "*") -DestinationPath $ArchiveName
Write-Host "Wrote $ArchiveName"

$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Host "gh CLI not found; skipping GitHub release publish. Install gh and re-run, or run:"
    Write-Host "  gh release create $Tag $ArchiveName --title `"$Tag`" --generate-notes"
    exit 0
}

gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists; skipping creation."
} else {
    Write-Host "-- Creating GitHub release $Tag --"
    gh release create $Tag $ArchiveName --title $Tag --generate-notes
}

Write-Host "== Release $Tag complete =="
