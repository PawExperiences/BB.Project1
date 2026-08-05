# release.ps1 — tag and push v0.1.0. Run from repo root on the release branch.
$ErrorActionPreference = 'Stop'

$VERSION = 'v0.1.0'
$MESSAGE = 'Release v0.1.0 - initial release: e2e Space Invaders'

# Idempotency: skip if tag already exists locally
$existing = & git tag -l $VERSION 2>&1
if ($existing -match [regex]::Escape($VERSION)) {
    Write-Host "Tag $VERSION already exists locally - skipping creation."
} else {
    & git tag -a $VERSION -m $MESSAGE
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "Created annotated tag $VERSION."
}

# Push (no --force - never overwrite remote history)
& git push origin $VERSION
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Tag $VERSION pushed to origin. Release complete."
