# Automated release script for units 0.1.0.
# Run from a clean checkout of main, after every manual step in the release
# runbook is checked off. Safe to re-run: each stage skips itself if already done.

$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$Package = "units"
$Remote = "origin"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
Set-Location $RepoRoot

Write-Host "[release] checking working tree is clean"
$status = git status --porcelain
if ($status) {
    Write-Host "[release] ERROR: working tree is not clean"
    Write-Host $status
    exit 1
}

Write-Host "[release] running test suite"
python -m pytest -q

Write-Host "[release] running ruff lint and format check"
ruff check src tests
ruff format --check src tests

Write-Host "[release] building sdist and wheel"
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" -Confirm:$false }
python -m build

$artifacts = Get-ChildItem "dist" -ErrorAction SilentlyContinue
if (-not $artifacts) {
    Write-Host "[release] ERROR: no artifacts produced in dist/"
    exit 1
}

$tagExists = $false
try { git rev-parse -q --verify "refs/tags/$Tag" | Out-Null; $tagExists = $true } catch { $tagExists = $false }
if ($tagExists) {
    Write-Host "[release] tag $Tag already exists locally, skipping tag creation"
} else {
    Write-Host "[release] creating annotated tag $Tag"
    git tag -a $Tag -m "$Package $Version"
}
Write-Host "[release] pushing tag $Tag to $Remote"
git push $Remote $Tag

$releaseExists = $true
try { gh release view $Tag | Out-Null } catch { $releaseExists = $false }
if ($releaseExists) {
    Write-Host "[release] GitHub release $Tag already exists, skipping creation"
} else {
    Write-Host "[release] creating GitHub release $Tag"
    $notesFile = "release\RELEASE_NOTES.md"
    if (Test-Path $notesFile) {
        gh release create $Tag --title "$Package $Version" --notes-file $notesFile
    } else {
        gh release create $Tag --title "$Package $Version" --notes "$Package $Version"
    }
}

Write-Host "[release] uploading artifacts"
$artifactPaths = Get-ChildItem "dist" | ForEach-Object { $_.FullName }
gh release upload $Tag $artifactPaths --clobber

Write-Host "[release] running smoke test in a temporary venv"
$tmpVenv = Join-Path $env:TEMP ("units-release-" + [guid]::NewGuid().ToString())
python -m venv $tmpVenv
$wheel = (Get-ChildItem "dist\*.whl" | Select-Object -First 1).FullName
& "$tmpVenv\Scripts\pip.exe" install $wheel
& "$tmpVenv\Scripts\python.exe" -c "from units import convert; assert convert(1000, 'm', 'km') == 1.0; print('smoke test ok')"
Remove-Item -Recurse -Force $tmpVenv -Confirm:$false

Write-Host "[release] $Package $Version released as $Tag"
