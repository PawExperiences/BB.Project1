# release.ps1 - Tag, package, and publish e2e space invaders 0.1.0.
# Run from the repository root after smoke tests pass.
# Requires: git, gh (GitHub CLI), GH_TOKEN env var with repo scope.
# Idempotent: skips steps already completed.

$ErrorActionPreference = 'Stop'
$VERSION = '0.1.0'
$TAG = "v$VERSION"
$REPO = 'PawExperiences/BB.Project1'
$ARTIFACT = "e2e-space-invaders-$VERSION.zip"
$CHANGELOG = 'CHANGELOG.md'
$SOURCE_FILES = @(
    'index.html',
    'game.js',
    'gameConfig.js',
    'input.js',
    'player.js',
    'invaders.js',
    'collision.js',
    'README.md',
    '.github/workflows/build.yml'
)

Write-Host "=== Release $VERSION ==="

# --- Tag ---
$existingTag = & git tag -l $TAG 2>&1
if ($existingTag -match [regex]::Escape($TAG)) {
    Write-Host "[skip] Tag $TAG already exists."
} else {
    Write-Host "[tag] Creating annotated tag $TAG..."
    & git tag -a $TAG -m "Release e2e space invaders $VERSION"
    & git push origin $TAG
    Write-Host "[tag] $TAG pushed."
}

# --- Package ---
if (Test-Path $ARTIFACT) {
    Write-Host "[skip] Artifact $ARTIFACT already exists."
} else {
    Write-Host "[package] Creating $ARTIFACT..."
    Add-Type -Assembly 'System.IO.Compression.FileSystem'
    $zip = [System.IO.Compression.ZipFile]::Open(
        (Join-Path (Get-Location) $ARTIFACT),
        [System.IO.Compression.ZipArchiveMode]::Create
    )
    foreach ($file in $SOURCE_FILES) {
        if (Test-Path $file) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $zip, (Resolve-Path $file), $file
            ) | Out-Null
            Write-Host "  added: $file"
        } else {
            Write-Host "  [warn] missing: $file"
        }
    }
    $zip.Dispose()
    Write-Host "[package] $ARTIFACT created."
}

# --- GitHub Release ---
if (-not $env:GH_TOKEN) {
    Write-Host "[error] GH_TOKEN env var is not set. Cannot create GitHub Release."
    exit 1
}

$releaseCheck = & gh release view $TAG --repo $REPO 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[skip] GitHub Release $TAG already exists."
} else {
    Write-Host "[release] Creating GitHub Release $TAG..."
    if (Test-Path $CHANGELOG) {
        & gh release create $TAG $ARTIFACT `
            --repo $REPO `
            --title "e2e space invaders $VERSION" `
            --notes-file $CHANGELOG
    } else {
        & gh release create $TAG $ARTIFACT `
            --repo $REPO `
            --title "e2e space invaders $VERSION" `
            --notes "e2e space invaders $VERSION - initial release."
    }
    Write-Host "[release] GitHub Release $TAG published."
}

Write-Host "=== Done ==="
