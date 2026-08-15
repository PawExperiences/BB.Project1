# Idempotent: runs tests, verifies install, tags HEAD as vVERSION, pushes the
# tag, and publishes a GitHub release from RELEASE_NOTES_FILE. Run from the
# repo root on the exact commit you intend to ship, after tests are green.
#
# Env vars:
#   RELEASE_VERSION     version to release, default 0.1.0
#   RELEASE_NOTES_FILE  path to the release notes markdown, default RELEASE_NOTES.md
#   RELEASE_TITLE       GitHub release title, default "e2e link checker <version>"

$ErrorActionPreference = "Stop"

$Version = $env:RELEASE_VERSION
if (-not $Version) { $Version = "0.1.0" }
$Tag = "v$Version"
$NotesFile = $env:RELEASE_NOTES_FILE
if (-not $NotesFile) { $NotesFile = "RELEASE_NOTES.md" }
$Title = $env:RELEASE_TITLE
if (-not $Title) { $Title = "e2e link checker $Version" }

Write-Host "[release] running test suite as a release gate"
python -m pytest
if ($LASTEXITCODE -ne 0) { throw "pytest failed" }

Write-Host "[release] verifying the package installs cleanly"
python -m pip install .
if ($LASTEXITCODE -ne 0) { throw "pip install . failed" }

git rev-parse -q --verify "refs/tags/$Tag" 2>$null 1>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[release] tag $Tag already exists locally; skipping tag creation"
} else {
    Write-Host "[release] creating tag $Tag"
    git tag -a $Tag -m $Title
    if ($LASTEXITCODE -ne 0) { throw "git tag failed" }
}

Write-Host "[release] pushing tag $Tag to origin"
git push origin $Tag
if ($LASTEXITCODE -ne 0) { throw "git push failed" }

if (-not (Test-Path $NotesFile)) {
    Write-Error "[release] ERROR: $NotesFile not found; cannot publish release notes"
    exit 1
}

gh release view $Tag 2>$null 1>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[release] GitHub release $Tag already exists; skipping creation"
} else {
    Write-Host "[release] creating GitHub release $Tag"
    gh release create $Tag --title $Title --notes-file $NotesFile
    if ($LASTEXITCODE -ne 0) { throw "gh release create failed" }
}

Write-Host "[release] done"
