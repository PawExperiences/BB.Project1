<#
.SYNOPSIS
  release.ps1 -- automated release steps for Space Invaders 0.1.0.

.DESCRIPTION
  WHAT IT DOES (in order; every step is idempotent, safe to re-run):
    1. Verifies that every game file of the release is present.
    2. Builds the release artifact dist\space-invaders-0.1.0.zip from the
       game files (rebuilt from scratch on every run).
    3. Creates the annotated git tag v0.1.0 (skipped if it already exists).
    4. Pushes the tag to origin (skipped if the remote already has it).
    5. Creates the GitHub release v0.1.0 with the zip attached IF the gh
       CLI is available (skipped if the release exists); otherwise prints
       the exact manual steps.
  WHEN TO RUN: once, from an up-to-date checkout of main, AFTER the
  release PR (changelog + notes + these scripts) is merged and CI is green.

.EXAMPLE
  powershell -File release\scripts\release.ps1
#>

$ErrorActionPreference = "Stop"

$Version  = "0.1.0"
$Tag      = "v$Version"
$Title    = "Space Invaders $Version"
$Artifact = "dist\space-invaders-$Version.zip"

$CoreFiles = @(
  "index.html", "game.js", "gameConfig.js", "input.js", "player.js",
  "invaders.js", "collision.js", "level1.js", "level2.js",
  "level3.js", "boss.js", "README.md"
)
$OptionalFiles = @("levels.js", "CHANGELOG.md")

Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
Write-Host "Releasing $Title from $(Get-Location)"

# 1. verify files
$missing = @($CoreFiles | Where-Object { -not (Test-Path $_) })
if ($missing.Count -gt 0) {
  Write-Host ("ERROR: missing release files: " + ($missing -join ", "))
  Write-Host "All bundled game cards must be merged before tagging."
  exit 1
}
$files = @($CoreFiles) + @($OptionalFiles | Where-Object { Test-Path $_ })
Write-Host "All $($files.Count) release files present."

# 2. build artifact
New-Item -ItemType Directory -Force -Path "dist" | Out-Null
if (Test-Path $Artifact) { Remove-Item $Artifact -Force }
Write-Host "+ Compress-Archive <game files> -> $Artifact"
Compress-Archive -Path $files -DestinationPath $Artifact -Force
Write-Host "Built $Artifact ($((Get-Item $Artifact).Length) bytes)."

# 3. tag
git rev-parse -q --verify "refs/tags/$Tag" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tag $Tag already exists locally - skipping."
} else {
  Write-Host "+ git tag -a $Tag -m `"$Title`""
  git tag -a $Tag -m $Title
  if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: git tag failed"; exit 1 }
  Write-Host "Created annotated tag $Tag."
}

# 4. push tag
$remoteLines = git ls-remote --tags origin $Tag 2>$null
$remoteHas = @($remoteLines | Where-Object { $_ -match [regex]::Escape($Tag) }).Count -gt 0
if ($remoteHas) {
  Write-Host "Remote already has $Tag - skipping push."
} else {
  Write-Host "+ git push origin $Tag"
  git push origin $Tag
  if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: could not push the tag (auth/network?)."
    Write-Host "Push it manually: git push origin $Tag"
  } else {
    Write-Host "Pushed $Tag to origin."
  }
}

# 5. github release
if (Get-Command gh -ErrorAction SilentlyContinue) {
  gh release view $Tag 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists - skipping."
  } else {
    $notesFile = "release\RELEASE_NOTES.md"
    if (Test-Path $notesFile) {
      gh release create $Tag $Artifact --title $Title --latest --notes-file $notesFile
    } else {
      gh release create $Tag $Artifact --title $Title --latest --notes "$Title - a complete four-level Space Invaders in dependency-free ES modules. Open index.html in a browser (file:// works, no server needed) and press ENTER. See CHANGELOG.md for the full list of changes."
    }
    if ($LASTEXITCODE -ne 0) {
      Write-Host "WARNING: gh release create failed; finish manually (see below)."
    } else {
      Write-Host "GitHub release $Tag created with $Artifact."
    }
  }
} else {
  Write-Host "gh CLI not found - finish the release manually:"
  Write-Host "  1. Open https://github.com/PawExperiences/BB.Project1/releases/new"
  Write-Host "  2. Choose tag $Tag, title '$Title'"
  Write-Host "  3. Paste the release notes and attach $Artifact"
}

Write-Host "Done. $Title release steps completed."
