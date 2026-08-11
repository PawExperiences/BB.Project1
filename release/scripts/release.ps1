# Automated release script for factorlib.
# Builds the sdist+wheel, tags the release, pushes the tag, and creates
# (or reuses) the corresponding GitHub release with the built artifacts
# attached. Idempotent: safe to re-run if a previous step already
# completed.
# Run from the repository root: powershell -File release\scripts\release.ps1

$ErrorActionPreference = 'Stop'

$Version = '0.1.0'
$Tag = "v$Version"
$Title = 'e2e gate check 0.1.0'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '..\..')
$DistDir = Join-Path $RepoRoot 'dist'

Set-Location $RepoRoot

Write-Host "== Releasing factorlib $Version =="

Write-Host '-- Building distribution artifacts --'
if (Test-Path $DistDir) {
    Remove-Item -Recurse -Force $DistDir
}
python -m pip install --upgrade build
if ($LASTEXITCODE -ne 0) { throw 'pip install build failed' }
python -m build
if ($LASTEXITCODE -ne 0) { throw 'python -m build failed' }
$artifacts = Get-ChildItem -Path $DistDir -File -ErrorAction SilentlyContinue
if (-not $artifacts) {
    Write-Error 'no artifacts produced in dist/'
    exit 1
}
foreach ($a in $artifacts) {
    Write-Host "  built: $($a.FullName)"
}

Write-Host '-- Tagging release --'
$existingTag = git tag --list $Tag
if ($existingTag -eq $Tag) {
    Write-Host "  tag $Tag already exists locally, skipping tag creation"
} else {
    git tag -a $Tag -m $Title
    if ($LASTEXITCODE -ne 0) { throw 'git tag failed' }
}

Write-Host '-- Pushing tag --'
git push origin $Tag
if ($LASTEXITCODE -ne 0) { throw 'git push failed' }

Write-Host '-- Creating GitHub release --'
$releaseExists = $false
gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) { $releaseExists = $true }

if ($releaseExists) {
    Write-Host "  release $Tag already exists on GitHub, skipping creation"
} else {
    $notesFile = $null
    if (Test-Path (Join-Path $RepoRoot 'RELEASE_NOTES.md')) {
        $notesFile = Join-Path $RepoRoot 'RELEASE_NOTES.md'
    } elseif (Test-Path (Join-Path $RepoRoot 'CHANGELOG.md')) {
        $notesFile = Join-Path $RepoRoot 'CHANGELOG.md'
    }
    $artifactPaths = $artifacts | ForEach-Object { $_.FullName }
    if ($notesFile) {
        gh release create $Tag @artifactPaths --title $Title --notes-file $notesFile
    } else {
        gh release create $Tag @artifactPaths --title $Title --notes "Release $Title"
    }
    if ($LASTEXITCODE -ne 0) { throw 'gh release create failed' }
}

Write-Host "== Done: $Tag released =="
