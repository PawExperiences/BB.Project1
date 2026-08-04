# release.ps1 - package source, tag, and publish the GitHub Release.
# Usage: .\release\scripts\release.ps1 -Version 0.1.0
param(
    [Parameter(Mandatory=$true)][string]$Version
)

$ErrorActionPreference = 'Stop'
$Tag = "v$Version"
$Zip = "spaceinvaders-$Version.zip"
$Sources = @('index.html','game.js','gameConfig.js','input.js','player.js','invaders.js','collision.js','README.md','CHANGELOG.md')

# Step 1: create zip artifact
Write-Host "[1/4] Creating artifact $Zip..."
if (Test-Path $Zip) {
    Write-Host "      $Zip already exists, overwriting (idempotent)."
    Remove-Item $Zip
}
$filesToZip = $Sources | Where-Object { Test-Path $_ }
$missing   = $Sources | Where-Object { -not (Test-Path $_) }
foreach ($f in $missing) { Write-Warning "$f not found, skipping" }
Compress-Archive -Path $filesToZip -DestinationPath $Zip
Write-Host "      $Zip created."

# Step 2: create annotated tag (idempotent)
Write-Host "[2/4] Tagging $Tag..."
$existingTags = git tag -l
if ($existingTags -contains $Tag) {
    Write-Host "      Tag $Tag already exists, skipping."
} else {
    git tag -a $Tag -m "Release $Tag -- e2e Space Invaders"
}

# Step 3: push tag
Write-Host "[3/4] Pushing tag $Tag to origin..."
git push origin $Tag

# Step 4: create GitHub Release
Write-Host "[4/4] Creating GitHub Release $Tag..."
$ghArgs = @('release','create',$Tag,'--title',"e2e Space Invaders $Tag",$Zip)
if (Test-Path 'CHANGELOG.md') {
    $ghArgs += @('--notes-file','CHANGELOG.md')
} else {
    $ghArgs += @('--notes',"Release $Tag")
}
gh @ghArgs

Write-Host "
Release $Tag complete. Artifact: $Zip"
