# Release script for e2e standup poster.
# Tags the currently checked-out commit, builds it, and publishes a
# GitHub release with the dist folder attached as a zip artifact.
# Run this ONLY after checking out the confirmed release commit (see
# runbook: current main HEAD may not contain the app -- see the
# "reset for the next e2e project" finding). Idempotent: safe to re-run.

$ErrorActionPreference = "Stop"

$Version = $env:RELEASE_VERSION
if (-not $Version) { $Version = "0.1.0" }
$Tag = $env:RELEASE_TAG
if (-not $Tag) { $Tag = "v$Version" }
$NotesFile = $env:RELEASE_NOTES_FILE
if (-not $NotesFile) { $NotesFile = "release/RELEASE_NOTES.md" }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "../..")
Set-Location $RepoRoot

Write-Output "== Releasing $Tag =="

if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found at repo root. This checkout does not contain the standup-poster app. Confirm you checked out the correct release commit (runbook step 1)."
    exit 1
}

Write-Output "-- Installing dependencies (npm ci) --"
npm ci
if (-not $?) { exit 1 }

Write-Output "-- Building (npm run build) --"
npm run build
if (-not $?) { exit 1 }

if (-not (Test-Path "dist/index.html")) {
    Write-Error "Build did not produce dist/index.html"
    exit 1
}
Write-Output "Build OK: dist/index.html"

Write-Output "-- Packaging dist artifact --"
$Artifact = "standup-poster-$Version.zip"
if (Test-Path $Artifact) { Remove-Item $Artifact -Force }
Compress-Archive -Path "dist/*" -DestinationPath $Artifact
Write-Output "Artifact written: $Artifact"

Write-Output "-- Checking whether tag $Tag already exists --"
git rev-parse -q --verify "refs/tags/$Tag" *> $null
if ($?) {
    Write-Output "Tag $Tag already exists locally; not re-tagging (idempotent)."
} else {
    Write-Output "-- Creating annotated tag $Tag on current commit --"
    git tag -a $Tag -m "Release $Tag"
}
Write-Output "-- Pushing tag $Tag to origin (additive, no force) --"
git push origin $Tag

Write-Output "-- Checking whether GitHub release $Tag already exists --"
gh release view $Tag *> $null
if ($?) {
    Write-Output "Release $Tag already exists; uploading/overwriting artifact only."
    gh release upload $Tag $Artifact --clobber
} else {
    Write-Output "-- Creating GitHub release $Tag --"
    if (Test-Path $NotesFile) {
        gh release create $Tag $Artifact --title $Tag --notes-file $NotesFile
    } else {
        gh release create $Tag $Artifact --title $Tag --generate-notes
    }
}

Write-Output "== Done. Release $Tag published. =="
