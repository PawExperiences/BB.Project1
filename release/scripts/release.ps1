# release.ps1 -- Tags the current HEAD as v0.1.0 and pushes the tag to origin.
# Run ONCE after CI is green and before creating the GitHub Release.
# Idempotent: if the tag already exists locally it skips creation and pushes.

$ErrorActionPreference = 'Stop'

$TAG = 'v0.1.0'
$MESSAGE = 'Release e2e calculator 0.1.0'

$existingTags = git tag -l $TAG 2>&1
if ($existingTags -match [regex]::Escape($TAG)) {
    Write-Host "Tag $TAG already exists locally -- skipping creation, pushing only."
} else {
    Write-Host "+ git tag -a $TAG -m '$MESSAGE'"
    git tag -a $TAG -m $MESSAGE
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "Created annotated tag $TAG"
}

Write-Host "+ git push origin $TAG"
git push origin $TAG
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Done. Tag $TAG pushed to origin."
Write-Host "Next step: create the GitHub Release at https://github.com/PawExperiences/BB.Project1/releases/new"
