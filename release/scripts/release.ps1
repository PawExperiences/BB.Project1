# Automated release script for factorlib 0.1.0.
# Installs build/test tooling, installs factorlib editable, runs the test
# suite, builds the sdist+wheel, smoke-tests the CLI, tags the commit,
# pushes the tag, and creates a DRAFT GitHub Release with the artifacts
# attached. Run from anywhere inside the repo, on the commit that should
# become v0.1.0. A human must still review and publish the draft release
# on GitHub -- this script never makes it public.

$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$Repo = "PawExperiences/BB.Project1"

$RepoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $RepoRoot

Write-Host "== 1. Ensuring build/test tooling =="
foreach ($pkg in @("pytest", "build")) {
    python -c "import $pkg" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$pkg not found; installing..."
        python -m pip install $pkg
    }
}

Write-Host "== 2. Installing factorlib (editable) =="
python -m pip install -e .

Write-Host "== 3. Running test suite =="
python -m pytest

Write-Host "== 4. Building sdist and wheel =="
python -m build

Write-Host "== 5. Smoke-testing the CLI =="
factorlib 12 18 7

Write-Host "== 6. Tagging release =="
git rev-parse -q --verify "refs/tags/$Tag" > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists locally, skipping tag creation."
} else {
    git tag -a $Tag -m "factorlib $Version"
}

Write-Host "== 7. Pushing tag =="
git push origin $Tag

Write-Host "== 8. Creating draft GitHub release =="
$NotesPath = Join-Path $RepoRoot "release\RELEASE_NOTES.md"
$DistFiles = Get-ChildItem -Path "dist" -Filter "factorlib-$Version*" | ForEach-Object { $_.FullName }
if (Test-Path $NotesPath) {
    gh release create $Tag $DistFiles --repo $Repo --title "factorlib $Version" --draft --notes-file $NotesPath
} else {
    gh release create $Tag $DistFiles --repo $Repo --title "factorlib $Version" --draft --notes "factorlib $Version"
}

Write-Host "Release $Tag prepared as a DRAFT. A maintainer must review and publish it on GitHub."
