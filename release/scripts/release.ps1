$ErrorActionPreference = "Stop"

$Version = if ($env:RELEASE_VERSION) { $env:RELEASE_VERSION } else { "0.1.0" }
$Tag = if ($env:RELEASE_TAG) { $env:RELEASE_TAG } else { "v$Version" }
$Remote = if ($env:RELEASE_REMOTE) { $env:RELEASE_REMOTE } else { "origin" }
$Branch = if ($env:RELEASE_BRANCH) { $env:RELEASE_BRANCH } else { "main" }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path (Join-Path $ScriptDir "..") "..")
Set-Location $RepoRoot

Write-Host "-- Running test suite (python -m pytest) --"
python -m pytest -q
if ($LASTEXITCODE -ne 0) { throw "pytest failed" }

Write-Host "-- Running ruff lint and format checks --"
ruff check src tests
if ($LASTEXITCODE -ne 0) { throw "ruff check failed" }
ruff format --check src tests
if ($LASTEXITCODE -ne 0) { throw "ruff format check failed" }

Write-Host "-- Verifying shipped unit tables match the resolved metric-only spec --"
$CheckScript = @'
import sys
sys.path.insert(0, "src")
from units import LENGTH_FACTORS, MASS_FACTORS
expected_length = {"m", "km", "cm", "mm"}
expected_mass = {"g", "kg", "mg"}
if set(LENGTH_FACTORS) != expected_length or set(MASS_FACTORS) != expected_mass:
    print("!! Unit table mismatch: this release bundle has two conflicting task specs.")
    print("   expected length=%s mass=%s" % (sorted(expected_length), sorted(expected_mass)))
    print("   found    length=%s mass=%s" % (sorted(LENGTH_FACTORS), sorted(MASS_FACTORS)))
    print("   STOP and have a human confirm which unit set is meant to ship before releasing.")
    sys.exit(1)
print("   unit tables OK")
'@
$CheckScript | python -
if ($LASTEXITCODE -ne 0) { throw "unit table verification failed" }

if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }

$uv = Get-Command uv -ErrorAction SilentlyContinue
if ($uv) {
    Write-Host "-- Building distribution artifacts (uv build) --"
    uv build
    if ($LASTEXITCODE -ne 0) { throw "uv build failed" }
} else {
    Write-Host "-- uv not found, building with python -m build --"
    python -m build
    if ($LASTEXITCODE -ne 0) { throw "python -m build failed" }
}

$Artifacts = Get-ChildItem -Path "dist" -Filter "*$Version*"
if (-not $Artifacts) { throw "No build artifacts matching version $Version found in dist/" }
Write-Host "   built artifacts:"
$Artifacts | ForEach-Object { Write-Host "   $($_.FullName)" }

$ExistingTag = git tag --list $Tag
if ($ExistingTag) {
    Write-Host "-- Tag $Tag already exists locally, skipping tag creation --"
} else {
    Write-Host "-- Creating annotated tag $Tag --"
    git tag -a $Tag -m "e2e unit converter $Version"
    if ($LASTEXITCODE -ne 0) { throw "git tag failed" }
    Write-Host "-- Pushing tag $Tag to $Remote --"
    git push $Remote $Tag
    if ($LASTEXITCODE -ne 0) { throw "git push failed" }
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($gh) {
    gh release view $Tag 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "-- GitHub release $Tag already exists, skipping creation --"
    } else {
        $NotesFile = "release/RELEASE_NOTES.md"
        $ArtifactPaths = $Artifacts | ForEach-Object { $_.FullName }
        Write-Host "-- Creating GitHub release $Tag --"
        if (Test-Path $NotesFile) {
            gh release create $Tag $ArtifactPaths --title "e2e unit converter $Version" --target $Branch --notes-file $NotesFile
        } else {
            gh release create $Tag $ArtifactPaths --title "e2e unit converter $Version" --target $Branch --notes "e2e unit converter $Version"
        }
        if ($LASTEXITCODE -ne 0) { throw "gh release create failed" }
    }
} else {
    Write-Host "-- GitHub CLI (gh) not found; skipping release publish. Install gh and re-run, or publish manually. --"
}

Write-Host "Release $Tag complete."
