# Automated release script for e2e quote page v0.1.0.
# Builds the static site, tags the commit, packages dist/ into a zip,
# and (if the GitHub CLI is available and authenticated) publishes a
# GitHub release with the artifact attached. Safe to re-run. Run only
# after the runbook's STOP-GATE steps are confirmed.

$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$RepoRoot = (git rev-parse --show-toplevel).Trim()
$DistDir = Join-Path $RepoRoot "dist"
$ReleaseDir = Join-Path $RepoRoot "release"
$Artifact = Join-Path $ReleaseDir "e2e-quote-page-$Version.zip"
$NotesFile = Join-Path $ReleaseDir "RELEASE_NOTES.md"

Write-Host "== e2e quote page release script =="

$Status = git -C $RepoRoot status --porcelain
if ($Status) {
    Write-Host "ERROR: working tree is not clean. Commit or stash changes before releasing."
    exit 1
}

$Required = @("package.json", "astro.config.mjs", "src/pages/index.astro", "src/data/quotes.json", "src/styles/print.css", "src/lib/pick.ts", "README.md")
$Missing = @()
foreach ($f in $Required) {
    if (-not (Test-Path (Join-Path $RepoRoot $f))) {
        $Missing += $f
    }
}
if ($Missing.Count -gt 0) {
    Write-Host ("ERROR: this checkout is missing required release files: " + ($Missing -join ", "))
    Write-Host "This matches the STOP-GATE concern in the runbook -- do not release."
    Write-Host "Confirm the correct commit is checked out before re-running this script."
    exit 1
}

Write-Host "-- Installing dependencies (npm ci) --"
Push-Location $RepoRoot
npm ci
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }

Write-Host "-- Building static site (npm run build) --"
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

$IndexPath = Join-Path $DistDir "index.html"
if (-not (Test-Path $IndexPath)) {
    Write-Host "ERROR: build did not produce dist/index.html"
    exit 1
}
Write-Host "Build OK: $IndexPath"

if (-not (Test-Path $ReleaseDir)) {
    New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
}
if (Test-Path $Artifact) {
    Remove-Item $Artifact -Force -Confirm:$false
}
Write-Host "-- Packaging $DistDir -> $Artifact --"
Compress-Archive -Path (Join-Path $DistDir "*") -DestinationPath $Artifact
Write-Host "Artifact written: $Artifact"

$TagExists = git -C $RepoRoot rev-parse -q --verify "refs/tags/$Tag"
if ($TagExists) {
    Write-Host "Tag $Tag already exists, skipping tag creation."
} else {
    Write-Host "-- Creating annotated tag $Tag --"
    git -C $RepoRoot tag -a $Tag -m "e2e quote page $Version"
    Write-Host "-- Pushing tag $Tag to origin --"
    git -C $RepoRoot push origin $Tag
}

$Gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $Gh) {
    Write-Host "GitHub CLI (gh) not found; skipping GitHub release publish step."
    Write-Host "Publish manually: gh release create $Tag $Artifact --title 'e2e quote page $Version' --notes-file $NotesFile"
} else {
    & gh release view $Tag *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "GitHub release $Tag already exists, uploading artifact if missing..."
        & gh release upload $Tag $Artifact --clobber
    } else {
        Write-Host "-- Creating GitHub release $Tag --"
        if (Test-Path $NotesFile) {
            & gh release create $Tag $Artifact --title "e2e quote page $Version" --notes-file $NotesFile
        } else {
            & gh release create $Tag $Artifact --title "e2e quote page $Version" --notes "e2e quote page $Version"
        }
    }
}

Write-Host "== Release script complete =="
