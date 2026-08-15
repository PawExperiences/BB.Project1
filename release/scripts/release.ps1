# Tag and publish a GitHub release.
# Usage: powershell -File release/scripts/release.ps1 -Version 0.1.0 [-NotesFile path] [-Remote origin] [-Branch main]
param(
    [Parameter(Mandatory = $true)][string]$Version,
    [string]$NotesFile = "",
    [string]$Remote = "origin",
    [string]$Branch = "main"
)
$ErrorActionPreference = "Stop"

$RepoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $RepoRoot
Write-Host "OK: running from repo root '$RepoRoot'"

$Tag = "v$Version"

Write-Host "+ git rev-parse --abbrev-ref HEAD"
$CurrentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($CurrentBranch -ne $Branch) {
    Write-Host "ERROR: expected branch '$Branch', currently on '$CurrentBranch'"
    exit 1
}
Write-Host "OK: on branch '$Branch'"

Write-Host "+ git status --porcelain"
$Status = (git status --porcelain)
if ($Status) {
    Write-Host "ERROR: working tree is not clean:"
    Write-Host $Status
    exit 1
}
Write-Host "OK: working tree is clean"

Write-Host "+ git fetch $Remote --tags"
git fetch $Remote --tags

$ChangelogText = Get-Content -Raw -Path "CHANGELOG.md"
$Needle = "## [$Version] - "
if (-not ($ChangelogText.Contains($Needle))) {
    Write-Host "ERROR: CHANGELOG.md has no '## [$Version] - YYYY-MM-DD' heading"
    exit 1
}
Write-Host "OK: CHANGELOG.md has a '[$Version]' section"

git rev-parse -q --verify "refs/tags/$Tag" *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: tag '$Tag' already exists locally, skipping tag creation (idempotent)"
} else {
    Write-Host "+ git tag -a $Tag -m Release $Tag"
    git tag -a $Tag -m "Release $Tag"
    Write-Host "OK: created annotated tag '$Tag'"
}

$RemoteTags = (git ls-remote --tags $Remote)
$TagRef = "refs/tags/$Tag"
$Found = $false
foreach ($line in $RemoteTags) {
    if ($line -like "*$TagRef*") { $Found = $true }
}
if ($Found) {
    Write-Host "OK: tag '$Tag' already exists on '$Remote', skipping push (idempotent)"
} else {
    Write-Host "+ git push $Remote $Tag"
    git push $Remote $Tag
    Write-Host "OK: pushed tag '$Tag' to '$Remote'"
}

$GhCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($GhCmd) {
    gh release view $Tag *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: GitHub release '$Tag' already exists, skipping creation (idempotent)"
    } else {
        if ($NotesFile -ne "") {
            Write-Host "+ gh release create $Tag --title $Tag --notes-file $NotesFile"
            gh release create $Tag --title $Tag --notes-file $NotesFile
        } else {
            Write-Host "+ gh release create $Tag --title $Tag --generate-notes"
            gh release create $Tag --title $Tag --generate-notes
        }
        Write-Host "OK: created GitHub release '$Tag'"
    }
} else {
    Write-Host "NOTE: 'gh' CLI not found; create the GitHub release for '$Tag' manually"
}

Write-Host "DONE: release $Tag tagged and published"
