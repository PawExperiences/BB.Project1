# Automated release steps for e2e-space-invaders-cc: tag, package, and publish
# the GitHub Release. Run after CI is green and release/RELEASE_NOTES.md has
# been written. Idempotent: safe to re-run.
$ErrorActionPreference = "Stop"

$Version = $env:RELEASE_VERSION
if (-not $Version) { $Version = "0.5.0" }
$Tag = $Version

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
Set-Location $RepoRoot

$ArtifactFiles = @("index.html","game.js","gameConfig.js","input.js","player.js","invaders.js","collision.js","level1.js","level2.js","level3.js","boss.js","README.md")
$ZipName = "e2e-space-invaders-cc-$Version.zip"
$ReleaseNotes = Join-Path $RepoRoot "release\RELEASE_NOTES.md"

foreach ($f in $ArtifactFiles) {
    if (-not (Test-Path $f)) {
        Write-Error "ERROR: missing expected shipped file: $f"
        exit 1
    }
}

$existingTags = git tag -l $Tag
if ($existingTags -contains $Tag) {
    Write-Host "Tag $Tag already exists locally, skipping tag creation."
} else {
    Write-Host "+ git tag -a $Tag -m 'e2e space invaders cc $Version'"
    git tag -a $Tag -m "e2e space invaders cc $Version"
}

Write-Host "+ git push origin $Tag"
git push origin $Tag

Write-Host "+ packaging $ZipName"
if (Test-Path $ZipName) { Remove-Item $ZipName -Force }
Compress-Archive -Path $ArtifactFiles -DestinationPath $ZipName

& gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists; uploading/overwriting the asset only."
    & gh release upload $Tag $ZipName --clobber
} else {
    if (-not (Test-Path $ReleaseNotes)) {
        Write-Error "ERROR: $ReleaseNotes not found; write the release notes before running this script."
        exit 1
    }
    & gh release create $Tag $ZipName --title "e2e space invaders cc $Version" --notes-file $ReleaseNotes
}

Write-Host "Release $Tag published."
