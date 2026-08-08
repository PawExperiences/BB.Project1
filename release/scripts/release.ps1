# release.ps1 — Tag v0.1.0, package artifact, create GitHub Release.
# Run from the repository root with GH_TOKEN env var set (PAT, contents: write).

$ErrorActionPreference = 'Stop'

$ReleaseVersion = '0.1.0'
$Tag = "v$ReleaseVersion"
$ReleaseTitle = "e2e Space Invaders $ReleaseVersion"
$OutputDir = 'release'
$ArtifactName = "e2e-space-invaders-$ReleaseVersion.zip"
$ArtifactPath = Join-Path $OutputDir $ArtifactName
$NotesPath = Join-Path $OutputDir 'RELEASE_NOTES.md'

$FilesToPackage = @(
    'index.html', 'game.js', 'gameConfig.js', 'constants.js',
    'input.js', 'player.js', 'invaders.js', 'collision.js',
    'level1.js', 'level2.js', 'level3.js', 'boss.js', 'README.md'
)

$ReleaseNotes = @"
## e2e Space Invaders v$ReleaseVersion

First playable release -- a pure-browser, zero-dependency Space Invaders clone built with vanilla ES modules and the HTML5 Canvas API.

Open index.html directly from your filesystem (no server, no bundler, no npm) and play through four levels to the multi-phase boss finale.

### Highlights
- Full four-level arc: classic grid -> enemies shoot back with UFO bonuses -> destructible shields + formation split -> two-phase boss
- Fixed-timestep game loop with delta capping (no burst updates on tab restore)
- Procedural canvas-primitive rendering throughout -- no image assets
- Progressive difficulty: step interval scales with survivor count; boss doubles fire rate at half HP
- Zero external dependencies; works at file:// URL
"@

Write-Host "=== Release $Tag ==="

# Prerequisites
if (-not $env:GH_TOKEN) {
    Write-Error '[error] GH_TOKEN environment variable is not set.'
    exit 1
}
try { gh --version | Out-Null } catch {
    Write-Error '[error] GitHub CLI (gh) is not installed or not on PATH.'
    exit 1
}
foreach ($f in $FilesToPackage) {
    if (-not (Test-Path $f)) {
        Write-Error "[error] Required file not found: $f"
        exit 1
    }
}

# Tag
$existingTag = git tag -l $Tag 2>$null
if ($existingTag -eq $Tag) {
    Write-Host "[info] Tag $Tag already exists locally -- skipping tag creation."
} else {
    git checkout main
    git pull origin main
    git tag -a $Tag -m "Release $Tag -- e2e Space Invaders initial release"
    Write-Host "[info] Created tag $Tag."
}
$pushResult = git push origin $Tag 2>&1
if ($LASTEXITCODE -ne 0 -and $pushResult -notmatch 'already exists') {
    Write-Error "[error] Failed to push tag $Tag."
    exit 1
}
Write-Host "[info] Tag $Tag is on remote."

# Package artifact
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }
if (Test-Path $ArtifactPath) {
    Write-Host "[info] Artifact $ArtifactPath already exists -- overwriting."
    Remove-Item $ArtifactPath
}
Write-Host "[info] Packaging artifact: $ArtifactPath"
$resolvedFiles = $FilesToPackage | Where-Object { Test-Path $_ } | ForEach-Object { Resolve-Path $_ }
Compress-Archive -Path $resolvedFiles -DestinationPath $ArtifactPath
Write-Host "[info] Artifact created: $ArtifactPath"

# Write release notes
[System.IO.File]::WriteAllText($NotesPath, $ReleaseNotes, [System.Text.Encoding]::UTF8)
Write-Host "[info] Release notes written to $NotesPath"

# Create GitHub Release
$releaseCheck = gh release view $Tag --json tagName 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[info] GitHub Release $Tag already exists -- skipping creation."
} else {
    gh release create $Tag `
        --title $ReleaseTitle `
        --notes-file $NotesPath `
        $ArtifactPath
    Write-Host "[info] GitHub Release $Tag created with artifact $ArtifactName."
}

Write-Host "=== Done. Visit: https://github.com/PawExperiences/BB.Project1/releases/tag/$Tag ==="
