# Idempotently tag and publish a GitHub release for this project.
#
# Usage: powershell -File release/scripts/release.ps1
#
# Environment variables:
#   RELEASE_VERSION   Version to release, e.g. "0.4.0" (default: 0.4.0)
#   RELEASE_NAME      Human release title (default: "e2e calculator cc <version>")
#   GIT_REMOTE        Git remote to push the tag to (default: origin)
#   GITHUB_REPO       "owner/repo" slug for the GitHub release (default: PawExperiences/BB.Project1)
#   CHANGELOG_FILE    Path to changelog excerpt to use as the release body (default: CHANGELOG.md)
#   DRY_RUN           If set to "1", print actions without executing them
#
# Requires: git in PATH, and the GitHub CLI ("gh", authenticated) to publish
# the GitHub release. If "gh" is not available, the script tags and pushes
# the tag only, and prints the manual "gh release create" command to run.

$ErrorActionPreference = "Stop"

$Version = $env:RELEASE_VERSION
if (-not $Version) { $Version = "0.4.0" }
if ($Version.StartsWith("v")) { $Tag = $Version } else { $Tag = "v$Version" }
$Remote = $env:GIT_REMOTE
if (-not $Remote) { $Remote = "origin" }
$RepoSlug = $env:GITHUB_REPO
if (-not $RepoSlug) { $RepoSlug = "PawExperiences/BB.Project1" }
$ReleaseName = $env:RELEASE_NAME
if (-not $ReleaseName) { $ReleaseName = "e2e calculator cc $Version" }
$ChangelogFile = $env:CHANGELOG_FILE
if (-not $ChangelogFile) { $ChangelogFile = "CHANGELOG.md" }
$DryRun = $env:DRY_RUN -eq "1"

function Invoke-Step {
    param([string[]]$CommandParts)
    Write-Host ("+ " + ($CommandParts -join " "))
    if (-not $DryRun) {
        & $CommandParts[0] $CommandParts[1..($CommandParts.Length - 1)]
        if ($LASTEXITCODE -ne 0) { throw "Command failed: $($CommandParts -join ' ')" }
    }
}

$existingTags = (git tag --list $Tag)
if ($existingTags -eq $Tag) {
    Write-Host "Tag $Tag already exists locally; skipping tag creation."
} else {
    Write-Host "Creating annotated tag $Tag at HEAD..."
    Invoke-Step @("git", "tag", "-a", $Tag, "-m", $ReleaseName)
}

Write-Host "Pushing tag $Tag to $Remote (additive; never deletes or rewrites history)..."
Invoke-Step @("git", "push", $Remote, $Tag)

$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Host "gh CLI not found. To publish the GitHub release manually, run:"
    Write-Host "  gh release create $Tag --repo $RepoSlug --title `"$ReleaseName`" --notes-file $ChangelogFile"
    exit 0
}

Write-Host "Creating GitHub release $Tag via gh CLI..."
if (Test-Path $ChangelogFile) {
    Invoke-Step @("gh", "release", "create", $Tag, "--repo", $RepoSlug, "--title", $ReleaseName, "--notes-file", $ChangelogFile)
} else {
    Invoke-Step @("gh", "release", "create", $Tag, "--repo", $RepoSlug, "--title", $ReleaseName, "--notes", $ReleaseName)
}
Write-Host "Done."
