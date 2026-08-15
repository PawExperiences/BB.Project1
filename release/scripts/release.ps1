# release/scripts/release.ps1
# Purpose: run pre-release checks, create and push the git tag, and publish
# the GitHub release for this version. Run from a clean checkout of the
# commit that should become the release, on a machine with push access and
# (optionally) an authenticated gh CLI.

$ErrorActionPreference = "Stop"

$Version = if ($env:RELEASE_VERSION) { $env:RELEASE_VERSION } else { "0.1.0" }
$Tag = "v$Version"
$NotesFile = if ($env:RELEASE_NOTES_FILE) { $env:RELEASE_NOTES_FILE } else { Join-Path "release" "RELEASE_NOTES.md" }

Write-Host "==> Releasing $Tag"

Write-Host "==> Checking working tree is clean"
$status = git status --porcelain
if ($status) {
    Write-Error "Working tree is not clean. Commit or stash changes first."
    exit 1
}

if ((Get-Command npm -ErrorAction SilentlyContinue) -and (Test-Path "package.json")) {
    Write-Host "==> Installing dependencies (npm ci)"
    npm ci
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    if (Test-Path "tsconfig.json") {
        Write-Host "==> Type-checking (tsc --noEmit)"
        npx tsc --noEmit
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    $scripts = npm run
    if ($scripts -match "test") {
        Write-Host "==> Running test suite (npm test)"
        npm test --silent
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
}

if (Test-Path "check.js") {
    Write-Host "==> Running CLI self-check (node check.js)"
    node check.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "==> Checking tag $Tag does not already exist"
git rev-parse $Tag 2>$null 1>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists locally; skipping tag creation."
} else {
    Write-Host "==> Creating annotated tag $Tag"
    git tag -a $Tag -m "Release $Tag"
}

Write-Host "==> Pushing tag $Tag to origin"
git push origin $Tag

if (Get-Command gh -ErrorAction SilentlyContinue) {
    gh release view $Tag 2>$null 1>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "==> GitHub release $Tag already exists; skipping creation."
    } else {
        Write-Host "==> Creating GitHub release $Tag"
        if (Test-Path $NotesFile) {
            gh release create $Tag --title $Tag --notes-file $NotesFile
        } else {
            gh release create $Tag --title $Tag --generate-notes
        }
    }
} else {
    Write-Host "NOTE: gh CLI not found; create the GitHub release for $Tag manually."
}

Write-Host "==> Done. Released $Tag."
