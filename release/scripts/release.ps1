# release.ps1 - Creates and pushes the v0.1.0 annotated release tag.
# Run ONCE on main after all pre-release checks pass.
$ErrorActionPreference = 'Stop'

$TAG = 'v0.1.0'
$MESSAGE = 'e2e Space Invaders 0.1.0 - initial release'
$REMOTE = 'origin'

Write-Host '[release] Checking current branch...'
$branch = & git rev-parse --abbrev-ref HEAD
if ($branch -ne 'main') {
    $reply = Read-Host "[release] WARNING: current branch is '$branch', not 'main'. Proceed? [y/N]"
    if ($reply -notmatch '^[yY]$') {
        Write-Host '[release] Aborted.'
        exit 1
    }
}

Write-Host '[release] Checking if tag already exists locally...'
$existingLocal = & git tag -l $TAG
if ($existingLocal -match [regex]::Escape($TAG)) {
    Write-Host "[release] Tag $TAG already exists locally - skipping tag creation."
} else {
    Write-Host "[release] Creating annotated tag $TAG..."
    & git tag -a $TAG -m $MESSAGE
    Write-Host "[release] Tag $TAG created."
}

Write-Host "[release] Checking if tag already exists on $REMOTE..."
$existingRemote = & git ls-remote --tags $REMOTE $TAG
if ($existingRemote -match [regex]::Escape($TAG)) {
    Write-Host "[release] Tag $TAG already exists on $REMOTE - skipping push."
} else {
    Write-Host "[release] Pushing tag $TAG to $REMOTE..."
    & git push $REMOTE $TAG
    Write-Host "[release] Tag $TAG pushed."
}

Write-Host "[release] Done. Release $TAG is live on $REMOTE."
Write-Host '[release] Next step: publish the GitHub Release at'
Write-Host "  https://github.com/PawExperiences/BB.Project1/releases/new?tag=$TAG"
