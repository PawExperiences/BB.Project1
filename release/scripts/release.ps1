# release/scripts/release.ps1
# Purpose: build, tag, and publish a badge-maker release (idempotent).
# Usage: $env:VERSION = "0.1.0"; powershell -File release/scripts/release.ps1

$ErrorActionPreference = "Stop"

$Version = $env:VERSION
if (-not $Version) { $Version = "0.1.0" }
$Tag = "v" + $Version
$NotesFile = $env:RELEASE_NOTES_FILE
if (-not $NotesFile) { $NotesFile = "RELEASE_NOTES.md" }

Write-Host "== badge-maker release script =="
Write-Host ("Version : " + $Version)
Write-Host ("Tag     : " + $Tag)

$status = git status --porcelain
if ($status) {
    Write-Error "ERROR: working tree is not clean. Commit or stash changes first."
    exit 1
}

Write-Host "-- npm ci"
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "-- npm run build"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path "dist/index.js") -or -not (Test-Path "dist/index.d.ts")) {
    Write-Error "ERROR: build did not produce dist/index.js and dist/index.d.ts."
    exit 1
}

$pkg = Get-Content package.json -Raw | ConvertFrom-Json
if ($pkg.version -ne $Version) {
    Write-Error ("ERROR: package.json version (" + $pkg.version + ") != VERSION (" + $Version + ").")
    exit 1
}

git rev-parse -q --verify ("refs/tags/" + $Tag) *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host ("-- tag " + $Tag + " already exists locally, skipping tag creation")
} else {
    Write-Host ("-- creating annotated tag " + $Tag)
    git tag -a $Tag -m ("Release " + $Tag)
}

$remoteTags = git ls-remote --tags origin ("refs/tags/" + $Tag)
if ($remoteTags -match [regex]::Escape($Tag)) {
    Write-Host ("-- tag " + $Tag + " already on origin, skipping push")
} else {
    Write-Host ("-- pushing tag " + $Tag + " to origin")
    git push origin $Tag
}

Write-Host "-- npm pack"
npm pack | Out-Null
$Tarball = "badge-maker-" + $Version + ".tgz"
if (-not (Test-Path $Tarball)) {
    Write-Error ("ERROR: expected artifact " + $Tarball + " was not created by npm pack.")
    exit 1
}
Write-Host ("-- artifact ready: " + $Tarball)

$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCmd) {
    gh release view $Tag *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host ("-- GitHub release " + $Tag + " already exists, skipping creation")
    } elseif (Test-Path $NotesFile) {
        gh release create $Tag $Tarball --title $Tag --notes-file $NotesFile
    } else {
        gh release create $Tag $Tarball --title $Tag --notes ("Release " + $Tag)
    }
} else {
    Write-Host ("-- gh CLI not found: create the GitHub release for " + $Tag + " manually and upload " + $Tarball)
}

Write-Host "== done. Remember: 'npm publish' requires interactive 2FA and is a separate manual step. =="
