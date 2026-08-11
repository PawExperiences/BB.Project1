# Releases wordcount: runs fmt/vet/build/test checks, builds the CLI binary,
# tags the commit, pushes the tag, and publishes/refreshes the GitHub release.
# Usage: powershell -File release\scripts\release.ps1
$ErrorActionPreference = "Stop"

if ($env:VERSION) { $Version = $env:VERSION } else { $Version = "0.1.0" }
$Tag = "v$Version"
if ($env:REMOTE) { $Remote = $env:REMOTE } else { $Remote = "origin" }
if ($env:BRANCH) { $Branch = $env:BRANCH } else { $Branch = "main" }
if ($env:OUT_PATH) { $OutPath = $env:OUT_PATH } else { $OutPath = "dist\wordcount.exe" }
if ($env:NOTES_FILE) { $NotesFile = $env:NOTES_FILE } else { $NotesFile = "release\notes\$Tag.md" }

Write-Output "==> Releasing $Tag from branch $Branch"

Write-Output "==> Checking working tree is clean"
$status = git status --porcelain
if ($status) {
    throw "ERROR: working tree is not clean. Commit or stash changes first."
}

Write-Output "==> Fetching and fast-forwarding $Branch"
git fetch $Remote
if ($LASTEXITCODE -ne 0) { throw "git fetch failed" }
git checkout $Branch
if ($LASTEXITCODE -ne 0) { throw "git checkout failed" }
git merge --ff-only "$Remote/$Branch"
if ($LASTEXITCODE -ne 0) { throw "git merge --ff-only failed" }

Write-Output "==> Checking gofmt"
$unformatted = gofmt -l .
if ($unformatted) {
    Write-Error "ERROR: the following files are not gofmt-clean:"
    Write-Error ($unformatted -join "`n")
    exit 1
}

Write-Output "==> Running go vet ./..."
go vet ./...
if ($LASTEXITCODE -ne 0) { throw "go vet failed" }

Write-Output "==> Running go test ./..."
go test ./...
if ($LASTEXITCODE -ne 0) { throw "go test failed" }

Write-Output "==> Building $OutPath"
$outDir = Split-Path -Parent $OutPath
if ($outDir -and -not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}
go build -o $OutPath ./...
if ($LASTEXITCODE -ne 0) { throw "go build failed" }

$null = git rev-parse $Tag 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Output "Tag $Tag already exists locally, skipping tag creation."
} else {
    git tag -a $Tag -m "e2e word count $Tag"
    if ($LASTEXITCODE -ne 0) { throw "git tag failed" }
}

$remoteTags = git ls-remote --tags $Remote
if ($remoteTags -match "refs/tags/${Tag}`$") {
    Write-Output "Tag $Tag already exists on $Remote, skipping push."
} else {
    git push $Remote $Tag
    if ($LASTEXITCODE -ne 0) { throw "git push failed" }
}

Write-Output "==> Publishing GitHub release $Tag"
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Warning "gh CLI not found; skipping GitHub release creation. Install the GitHub CLI and re-run, or create the release manually and upload $OutPath."
    exit 0
}

gh release view $Tag > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Output "GitHub release $Tag already exists, refreshing artifact."
    gh release upload $Tag $OutPath --clobber
} elseif (Test-Path $NotesFile) {
    gh release create $Tag $OutPath --title "e2e word count $Version" --notes-file $NotesFile
} else {
    Write-Warning "Notes file $NotesFile not found; creating release with auto-generated notes."
    gh release create $Tag $OutPath --title "e2e word count $Version" --generate-notes
}

Write-Output "==> Done. Released $Tag."
