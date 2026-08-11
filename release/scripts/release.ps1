# Release automation for csvclean 0.1.0.
#
# Confirms the CI build workflow still matches this release's toolchain, runs
# the test suite, builds the sdist/wheel, smoke-tests the built wheel in a
# throwaway venv, tags the release (if the tag does not already exist), and
# creates the GitHub release (if it does not already exist). Safe to re-run.
#
# Requires: git and the GitHub CLI ("gh") authenticated with push/release
# permissions on the repository remote.

$Version = "0.1.0"
$Tag = "v$Version"
$ReleaseTitle = "csvclean $Version"
$NotesPath = Join-Path "release" (Join-Path "notes" "$Tag.md")
$DistDir = "dist"
$WorkflowPath = Join-Path ".github" (Join-Path "workflows" "build.yml")

Write-Host "== csvclean release $Version =="

Write-Host "-- checking $WorkflowPath matches this release's toolchain --"
if (Test-Path $WorkflowPath) {
    $WorkflowContent = Get-Content $WorkflowPath -Raw
    if ($WorkflowContent -match "3\.12" -and $WorkflowContent -match "build") {
        Write-Host "  OK: workflow references Python 3.12 and a build command"
    } else {
        Write-Host "  WARNING: $WorkflowPath may not match pyproject.toml's requires-python (>=3.12)"
        Write-Host "  or the 'python -m build' command. If the build resource's command or"
        Write-Host "  artifact_path changed for this release, update the build resource config"
        Write-Host "  (not this workflow file) so it re-scaffolds."
    }
} else {
    Write-Host "  WARNING: $WorkflowPath not found; cannot verify CI toolchain currency"
}

Write-Host "-- running test suite --"
python -m pytest
if ($LASTEXITCODE -ne 0) { throw "pytest failed" }

Write-Host "-- building distribution artifacts --"
python -m build
if ($LASTEXITCODE -ne 0) { throw "python -m build failed" }

$Wheel = $null
if (Test-Path $DistDir) {
    $Wheel = Get-ChildItem -Path $DistDir -Filter "csvclean-$Version*.whl" -ErrorAction SilentlyContinue | Select-Object -First 1
}

if ($Wheel) {
    Write-Host "-- smoke-testing built wheel in a temporary venv --"
    $TmpVenv = Join-Path $env:TEMP ("csvclean-venv-" + $Version)
    if (Test-Path $TmpVenv) {
        Remove-Item -Recurse -Force -Confirm:$false $TmpVenv
    }
    python -m venv $TmpVenv
    & (Join-Path $TmpVenv "Scripts\pip.exe") install $Wheel.FullName
    if ($LASTEXITCODE -ne 0) { throw "pip install of built wheel failed" }
    & (Join-Path $TmpVenv "Scripts\csvclean.exe") --help
    if ($LASTEXITCODE -ne 0) { throw "csvclean --help failed from built wheel" }
    Remove-Item -Recurse -Force -Confirm:$false $TmpVenv
    Write-Host "  OK: csvclean installs and runs from the built wheel"
} else {
    Write-Host "  WARNING: could not find a built wheel in $DistDir to smoke-test"
}

git rev-parse -q --verify "refs/tags/$Tag" > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "-- tag $Tag already exists, skipping tag/push --"
} else {
    Write-Host "-- tagging $Tag --"
    git tag -a $Tag -m $ReleaseTitle
    git push origin $Tag
}

gh release view $Tag > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "-- GitHub release $Tag already exists, skipping create --"
} else {
    Write-Host "-- creating GitHub release $Tag --"
    $Assets = @()
    if (Test-Path $DistDir) {
        $Assets = Get-ChildItem -Path $DistDir -Filter "*$Version*" | ForEach-Object { $_.FullName }
    }
    if (Test-Path $NotesPath) {
        gh release create $Tag $Assets --title $ReleaseTitle --notes-file $NotesPath
    } else {
        gh release create $Tag $Assets --title $ReleaseTitle --notes "Release $Version"
    }
}

Write-Host "== release $Version complete =="
