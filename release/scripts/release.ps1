# Performs the e2e ticket mirror release: install, build, test, tag, and publish to GitHub.
$ErrorActionPreference = "Stop"

$Version = if ($env:RELEASE_VERSION) { $env:RELEASE_VERSION } else { "0.1.0" }
$Tag = if ($env:RELEASE_TAG) { $env:RELEASE_TAG } else { "v$Version" }
$Remote = if ($env:RELEASE_REMOTE) { $env:RELEASE_REMOTE } else { "origin" }
$NotesFile = if ($env:RELEASE_NOTES_FILE) { $env:RELEASE_NOTES_FILE } else { "RELEASE_NOTES.md" }

Write-Host "Releasing e2e ticket mirror $Tag"

$status = git status --porcelain
if ($status) {
    Write-Host "Working tree is not clean; commit or stash changes before releasing."
    exit 1
}

Write-Host "+ npm ci"
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "+ npm run build"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$hasTest = $false
if ($pkg.scripts -and $pkg.scripts.test) { $hasTest = $true }

if ($hasTest) {
    Write-Host "+ npm test"
    npm test
} else {
    Write-Host "+ npx --yes vitest run"
    npx --yes vitest run
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git rev-parse -q --verify "refs/tags/$Tag" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists locally; skipping tag creation."
} else {
    Write-Host "+ git tag -a $Tag -m `"Release $Tag`""
    git tag -a $Tag -m "Release $Tag"
}

Write-Host "+ git push $Remote $Tag"
git push $Remote $Tag

gh release view $Tag 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists; skipping creation."
} else {
    if (Test-Path $NotesFile) {
        Write-Host "+ gh release create $Tag --title $Tag --notes-file $NotesFile"
        gh release create $Tag --title $Tag --notes-file $NotesFile
    } else {
        Write-Host "+ gh release create $Tag --title $Tag --notes `"Release $Tag`""
        gh release create $Tag --title $Tag --notes "Release $Tag"
    }
}

Write-Host "Release $Tag complete."
