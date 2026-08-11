# Automated release steps for factorlib 0.1.0.
# Idempotent: safe to re-run. Requires git, python (with pip), and (for the
# publish step) an authenticated GitHub CLI (gh).
#
# Usage: powershell -File release\scripts\release.ps1
$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$DistDir = Join-Path $RepoRoot "dist"
$NotesFile = Join-Path $RepoRoot "release\notes\$Tag.md"

Set-Location $RepoRoot

Write-Host "-- Verifying working tree is clean --"
$status = git status --porcelain
if ($status) {
    Write-Host "Working tree is not clean; commit or stash changes before releasing." -ForegroundColor Red
    Write-Host $status
    exit 1
}
Write-Host "Working tree is clean."

Write-Host "-- Installing factorlib (editable) and release tooling --"
python -m pip install --quiet -e .
python -m pip install --quiet pytest ruff build

Write-Host "-- Running test suite --"
python -m pytest -q

Write-Host "-- Running lint checks --"
python -m ruff check .
python -m ruff format --check .

Write-Host "-- Building sdist and wheel --"
if (Test-Path $DistDir) {
    Remove-Item -Recurse -Force $DistDir
}
python -m build

Write-Host "-- Smoke-testing the built wheel in a throwaway venv --"
$SmokeDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $SmokeDir | Out-Null
try {
    python -m venv (Join-Path $SmokeDir "venv")
    $SmokePy = Join-Path $SmokeDir "venv\Scripts\python.exe"
    $Wheel = Get-ChildItem -Path $DistDir -Filter "*.whl" | Sort-Object Name | Select-Object -Last 1
    if (-not $Wheel) {
        Write-Host "No wheel found in dist/; the build step must run first." -ForegroundColor Red
        exit 1
    }
    & $SmokePy -m pip install --quiet $Wheel.FullName
    $Out = & $SmokePy -m factorlib.cli 12 18 7
    $Out | ForEach-Object { Write-Host $_ }
    if (($Out -notcontains "12: 2 2 3") -or ($Out -notcontains "18: 2 3 3") -or ($Out -notcontains "7: 7")) {
        Write-Host "Smoke test failed: unexpected CLI output for valid input." -ForegroundColor Red
        exit 1
    }
    & $SmokePy -m factorlib.cli 0 | Out-Null
    if ($LASTEXITCODE -ne 1) {
        Write-Host "Smoke test failed: 'factorlib 0' should exit with status 1." -ForegroundColor Red
        exit 1
    }
    Write-Host "Smoke test passed."
} finally {
    Remove-Item -Recurse -Force $SmokeDir
}

Write-Host "-- Tagging $Tag --"
git rev-parse -q --verify "refs/tags/$Tag" *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists locally; skipping tag creation."
} else {
    git tag -a $Tag -m "factorlib $Version"
}
git push origin $Tag

Write-Host "-- Publishing GitHub release $Tag --"
gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists; skipping creation."
} else {
    $Artifacts = Get-ChildItem -Path $DistDir | ForEach-Object { $_.FullName }
    if (Test-Path $NotesFile) {
        gh release create $Tag @Artifacts --title "factorlib $Version" --notes-file $NotesFile
    } else {
        gh release create $Tag @Artifacts --title "factorlib $Version" --notes "factorlib $Version"
    }
}

Write-Host "Release $Tag complete."
