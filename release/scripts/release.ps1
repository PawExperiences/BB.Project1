# Automates the factorlib release: lint, test, build, tag, push, and create the GitHub release.
# Idempotent - re-running skips any step whose result already exists (tag, GitHub release).
# Run from a clean checkout after CI is green. Requires: ruff, pytest, python -m build,
# git, and the gh CLI (already authenticated) on PATH.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$DistDir = Join-Path $RepoRoot "dist"

Set-Location $RepoRoot

$Name = python -c "import tomllib; print(tomllib.load(open('pyproject.toml','rb'))['project']['name'])"
$Version = python -c "import tomllib; print(tomllib.load(open('pyproject.toml','rb'))['project']['version'])"
$Tag = "v$Version"

Write-Host "Releasing $Name $Version as tag $Tag"

Write-Host ""
Write-Host "== Lint (ruff) =="
Write-Host "+ ruff check ."
ruff check .

Write-Host ""
Write-Host "== Test (pytest) =="
Write-Host "+ pytest -q"
pytest -q

Write-Host ""
Write-Host "== Build sdist + wheel =="
Write-Host "+ python -m build"
python -m build

Write-Host ""
Write-Host "== Git tag =="
git rev-parse -q --verify "refs/tags/$Tag" *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  tag $Tag already exists locally, skipping git tag"
} else {
    Write-Host "+ git tag -a $Tag -m `"$Name $Version`""
    git tag -a $Tag -m "$Name $Version"
}

$RemoteTag = git ls-remote --tags origin $Tag
if ($RemoteTag) {
    Write-Host "  tag $Tag already exists on origin, skipping push"
} else {
    Write-Host "+ git push origin $Tag"
    git push origin $Tag
}

Write-Host ""
Write-Host "== GitHub release =="
gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  GitHub release $Tag already exists, skipping gh release create"
} else {
    $NotesFile = Join-Path $RepoRoot "release\RELEASE_NOTES.md"
    $DistFiles = Get-ChildItem $DistDir | ForEach-Object { $_.FullName }
    if (Test-Path $NotesFile) {
        Write-Host "+ gh release create $Tag <dist files> --title `"$Name $Version`" --notes-file $NotesFile"
        gh release create $Tag $DistFiles --title "$Name $Version" --notes-file $NotesFile
    } else {
        Write-Host "+ gh release create $Tag <dist files> --title `"$Name $Version`" --notes `"$Name $Version`""
        gh release create $Tag $DistFiles --title "$Name $Version" --notes "$Name $Version"
    }
}

Write-Host ""
Write-Host "Done. Publishing to PyPI is a separate manual step - run:"
Write-Host "  twine upload $DistDir\*"
