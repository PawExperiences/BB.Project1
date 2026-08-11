# Automated release: verify, test, lint, build, tag and publish units 0.1.0.
$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$Remote = "origin"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
Set-Location $RepoRoot

Write-Host "== Releasing units $Version ($Tag) =="

$status = git status --porcelain
if ($status) {
    Write-Host "Working tree is not clean. Commit or stash changes before releasing."
    exit 1
}

Write-Host "-- Installing dependencies (uv sync) --"
uv sync
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "-- Running test suite (pytest) --"
uv run pytest -q
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "-- Running lint checks (ruff) --"
uv run ruff check .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
uv run ruff format --check .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "-- Building distribution artifacts (uv build) --"
uv build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$existingTag = git rev-parse -q --verify "refs/tags/$Tag"
if ($existingTag) {
    Write-Host "Tag $Tag already exists locally, skipping tag creation."
} else {
    Write-Host "-- Tagging $Tag --"
    git tag -a $Tag -m "units $Version"
}

$remoteTag = git ls-remote --tags $Remote $Tag
if ($remoteTag) {
    Write-Host "Tag $Tag already exists on $Remote, skipping push."
} else {
    Write-Host "-- Pushing tag $Tag to $Remote --"
    git push $Remote $Tag
}

$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghAvailable) {
    Write-Host "gh CLI not found: skipping GitHub release creation. Install gh and re-run, or create the release manually."
    exit 0
}

gh release view $Tag 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists, skipping creation."
    exit 0
}

$NotesFile = Join-Path $RepoRoot "release\notes\RELEASE_NOTES.md"
$distDir = Join-Path $RepoRoot "dist"
$artifacts = Get-ChildItem -Path $distDir | ForEach-Object { $_.FullName }
Write-Host "-- Creating GitHub release --"
if (Test-Path $NotesFile) {
    gh release create $Tag $artifacts --title "units $Version" --notes-file $NotesFile
} else {
    gh release create $Tag $artifacts --title "units $Version" --notes "units $Version"
}

Write-Host "== Release complete =="
