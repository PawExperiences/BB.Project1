# Automate the mdpdf 0.1.0 release: tag, build, and publish to GitHub Releases.
# Requires: git, gh (GitHub CLI, authenticated), python with the 'build'
# package installed (pip install build).
# Run from the repository root, on the commit that should become v0.1.0.
# Idempotent: safe to re-run if interrupted after tagging or publishing.

$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$Repo = "PawExperiences/BB.Project1"
$NotesFile = "release/RELEASE_NOTES.md"
$DistDir = "dist"

foreach ($tool in @("git", "gh", "python")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "required tool '$tool' not found on PATH"
        exit 1
    }
}

$status = git status --porcelain
if ($status) {
    Write-Error "working tree is not clean; commit or stash changes first"
    exit 1
}

git rev-parse -q --verify "refs/tags/$Tag" *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "tag $Tag already exists locally, skipping tag creation"
} else {
    Write-Host "+ git tag -a $Tag -m 'mdpdf $Version'"
    git tag -a $Tag -m "mdpdf $Version"
}

Write-Host "+ git push origin $Tag"
git push origin $Tag

Write-Host "building sdist and wheel with 'python -m build'"
python -m build

gh release view $Tag --repo $Repo *> $null
$releaseFound = ($LASTEXITCODE -eq 0)
if ($releaseFound) {
    Write-Host "GitHub release $Tag already exists, skipping release creation"
} else {
    if (-not (Test-Path $NotesFile)) {
        Write-Error "$NotesFile not found; write release notes before publishing"
        exit 1
    }
    $assets = Get-ChildItem -Path $DistDir -File | ForEach-Object { $_.FullName }
    if (-not $assets) {
        Write-Error "no build artifacts found under $DistDir"
        exit 1
    }
    Write-Host "+ gh release create $Tag --repo $Repo --title 'mdpdf $Version' --notes-file $NotesFile ..."
    gh release create $Tag --repo $Repo --title "mdpdf $Version" --notes-file $NotesFile $assets
}

Write-Host "release $Tag complete"
