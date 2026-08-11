# Purpose: cut and publish a wordcount release (tag, build artifacts, create GitHub release).
# Usage: release/scripts/release.ps1 [-Version 0.1.0]
param(
    [string]$Version = "0.1.0"
)

$ErrorActionPreference = "Stop"

$Tag = "v$Version"
$DistDir = "dist"
$NotesFile = "release/RELEASE_NOTES.md"

Write-Host "==> Releasing wordcount $Tag"

$Branch = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($Branch -ne "main") {
    Write-Host "Refusing to release from branch '$Branch' (expected 'main')"
    exit 1
}

Write-Host "==> Checking toolchain"
& go version

Write-Host "==> Formatting check (gofmt -l .)"
$unformatted = & gofmt -l .
if ($unformatted) {
    Write-Host "gofmt found unformatted files:"
    Write-Host ($unformatted -join "`n")
    exit 1
}

Write-Host "==> Building"
& go build ./...
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Vetting"
& go vet ./...
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Testing"
& go test ./...
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Tagging $Tag (idempotent: skips if the tag already exists)"
& git rev-parse $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists, skipping tag creation"
} else {
    & git tag -a $Tag -m "Release $Tag"
    & git push origin $Tag
}

Write-Host "==> Building release artifacts into $DistDir/"
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

$targets = @(
    @{ os = "linux";   arch = "amd64"; ext = "" },
    @{ os = "linux";   arch = "arm64"; ext = "" },
    @{ os = "darwin";  arch = "amd64"; ext = "" },
    @{ os = "darwin";  arch = "arm64"; ext = "" },
    @{ os = "windows"; arch = "amd64"; ext = ".exe" }
)

foreach ($t in $targets) {
    $out = Join-Path $DistDir ("wordcount_" + $t.os + "_" + $t.arch + $t.ext)
    Write-Host "  building $out"
    $env:GOOS = $t.os
    $env:GOARCH = $t.arch
    & go build -o $out .
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
Remove-Item Env:\GOOS -ErrorAction SilentlyContinue
Remove-Item Env:\GOARCH -ErrorAction SilentlyContinue

$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghCmd) {
    Write-Host "gh CLI not found; skipping GitHub release creation. Install gh, or create the release manually and upload the files in $DistDir/."
    Write-Host "==> Done. Artifacts in $DistDir/"
    exit 0
}

Write-Host "==> Creating GitHub release $Tag (idempotent: skips if it already exists)"
& gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Release $Tag already exists, skipping creation"
} else {
    $artifacts = Get-ChildItem -Path $DistDir | ForEach-Object { $_.FullName }
    if (Test-Path $NotesFile) {
        & gh release create $Tag $artifacts --title "wordcount $Tag" --notes-file $NotesFile
    } else {
        & gh release create $Tag $artifacts --title "wordcount $Tag" --notes "See CHANGELOG.md for details."
    }
}

Write-Host "==> Done. Artifacts in $DistDir/"
