# release/scripts/release.ps1
# Performs the automated e2e-cli-greeter release steps: verify, tag, and publish a GitHub release.
# Usage: $env:VERSION = "0.1.0"; powershell -File release/scripts/release.ps1

$ErrorActionPreference = "Stop"

if (-not $env:VERSION) { $env:VERSION = "0.1.0" }
if (-not $env:REMOTE) { $env:REMOTE = "origin" }
$Version = $env:VERSION
$Remote = $env:REMOTE
$Tag = "v$Version"
if (-not $env:NOTES_FILE) { $env:NOTES_FILE = "release/notes/v$Version.md" }
if (-not $env:TITLE) { $env:TITLE = "e2e cli greeter $Version" }
$NotesFile = $env:NOTES_FILE
$Title = $env:TITLE

Write-Output "== release.ps1: releasing $Title as tag $Tag =="

$status = git status --porcelain
if ($status) {
    Write-Error "ERROR: working tree is not clean. Commit or stash changes before releasing."
    exit 1
}
Write-Output "OK: working tree is clean."

if (Test-Path "package.json") {
    Write-Output "-> npm ci"
    npm ci
    $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($pkg.scripts -and $pkg.scripts.lint) {
        Write-Output "-> npm run lint"
        npm run lint
    } else {
        Write-Output "SKIP: no 'lint' script in package.json"
    }
    if ($pkg.scripts -and $pkg.scripts.test) {
        Write-Output "-> npm test"
        npm test
    } else {
        Write-Output "SKIP: no 'test' script in package.json"
    }
} else {
    Write-Output "SKIP: no package.json found"
}

if (Test-Path "check.js") {
    Write-Output "-> node check.js"
    node check.js
} else {
    Write-Output "SKIP: check.js not found"
}

git rev-parse $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Output "SKIP: local tag $Tag already exists"
} else {
    Write-Output "-> git tag -a $Tag"
    git tag -a $Tag -m "Release $Tag"
}

$remoteTags = git ls-remote --tags $Remote "refs/tags/$Tag"
if ($remoteTags -match [regex]::Escape($Tag)) {
    Write-Output "SKIP: tag $Tag already on $Remote"
} else {
    Write-Output "-> git push $Remote $Tag"
    git push $Remote $Tag
}

$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Error "ERROR: GitHub CLI (gh) not found. Install gh, then create the release manually: gh release create $Tag --title `"$Title`" --notes-file `"$NotesFile`""
    exit 1
}

gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Output "SKIP: GitHub release $Tag already exists"
} else {
    if (-not (Test-Path $NotesFile)) {
        Write-Error "ERROR: notes file $NotesFile not found. Save the release notes there first."
        exit 1
    }
    Write-Output "-> gh release create $Tag"
    gh release create $Tag --title $Title --notes-file $NotesFile
}

foreach ($f in @("greet.js", "README.md", "check.js")) {
    if (Test-Path $f) {
        Write-Output "-> gh release upload $Tag $f"
        gh release upload $Tag $f --clobber
    }
}

Write-Output "== release.ps1: done =="
