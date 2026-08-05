# release.ps1 -- tag and push v0.1.0 to origin.
#
# Run from the repository root on the clean default branch,
# immediately before creating the GitHub Release.
# Idempotent: if the tag already exists locally and remotely it reports so and exits 0.

$ErrorActionPreference = 'Stop'

$TAG     = 'v0.1.0'
$MESSAGE = 'Release e2e prime tester 0.1.0'
$REMOTE  = 'origin'

Write-Host "[release] Tagging $TAG ..."

# Check if tag already exists locally
$localTag = & git tag -l $TAG 2>&1
if ($localTag -match [regex]::Escape($TAG)) {
    Write-Host "[release] Tag $TAG already exists locally -- skipping creation."
} else {
    & git tag -a $TAG -m $MESSAGE
    if ($LASTEXITCODE -ne 0) { Write-Error "git tag failed"; exit 1 }
    Write-Host "[release] Created annotated tag $TAG."
}

# Check if tag already exists on remote
$remoteTag = & git ls-remote --tags $REMOTE $TAG 2>&1
if ($remoteTag -match [regex]::Escape($TAG)) {
    Write-Host "[release] Tag $TAG already present on $REMOTE -- skipping push."
} else {
    & git push $REMOTE $TAG
    if ($LASTEXITCODE -ne 0) { Write-Error "git push failed"; exit 1 }
    Write-Host "[release] Pushed $TAG to $REMOTE."
}

Write-Host "[release] Done. Verify at: https://github.com/PawExperiences/BB.Project1/releases"
