# release.ps1 -- Tag, build, and publish GitHub release for e2e prime tester 0.3.0.
# Run ONCE after CI is green on main. Requires: git, cmake, gh (GitHub CLI) on PATH.
$ErrorActionPreference = 'Stop'

$TAG = 'v0.3.0'
$RELEASE_TITLE = 'e2e prime tester 0.3.0'
$NOTES_FILE = 'docs/releases/0-3-0.md'
$BUILD_DIR = 'build'
$BINARY_NAME = 'prime_tester'

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot
Write-Host "[release.ps1] Working directory: $RepoRoot"

# Tag (idempotent)
$existingTags = git tag --list
if ($existingTags -contains $TAG) {
    Write-Host "[release.ps1] Tag $TAG already exists -- skipping tag creation."
} else {
    git tag -a $TAG -m "Release $RELEASE_TITLE"
    Write-Host "[release.ps1] Tag $TAG created."
    git push origin $TAG
    Write-Host "[release.ps1] Tag pushed to origin."
}

# Build
cmake -B $BUILD_DIR -S . -DCMAKE_BUILD_TYPE=Release
cmake --build $BUILD_DIR --config Release

# Locate binary
$BinaryPath = $null
$Candidates = @(
    "$BUILD_DIR\$BINARY_NAME.exe",
    "$BUILD_DIR\Release\$BINARY_NAME.exe",
    "$BUILD_DIR\$BINARY_NAME",
    "$BUILD_DIR\Release\$BINARY_NAME"
)
foreach ($c in $Candidates) {
    if (Test-Path $c) {
        $BinaryPath = $c
        break
    }
}

if ($null -eq $BinaryPath) {
    Write-Host "[release.ps1] WARNING: binary '$BINARY_NAME' not found in $BUILD_DIR. Proceeding without artifact."
    gh release create $TAG --title $RELEASE_TITLE --notes-file $NOTES_FILE
} else {
    Write-Host "[release.ps1] Binary found: $BinaryPath"
    gh release create $TAG --title $RELEASE_TITLE --notes-file $NOTES_FILE $BinaryPath
}

Write-Host "[release.ps1] Done."
