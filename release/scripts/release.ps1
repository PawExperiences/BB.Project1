# Automated release steps for e2e quote page: build, tag, publish GitHub release.
$ErrorActionPreference = "Stop"

$Version = $env:RELEASE_VERSION
if (-not $Version) { $Version = "0.1.0" }
$Tag = "v$Version"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path (Join-Path $ScriptDir "..") "..")
$DistDir = Join-Path $RepoRoot "dist"
$ChangelogPath = Join-Path $RepoRoot "CHANGELOG.md"

Set-Location $RepoRoot

Write-Host "+ git status --porcelain"
$Status = git status --porcelain
if ($Status) {
    Write-Host "Working tree is not clean. Commit or stash changes before releasing."
    exit 1
}
Write-Host "Working tree is clean."

Write-Host "+ npm ci"
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "+ npm run build"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$IndexHtml = Join-Path $DistDir "index.html"
if (-not (Test-Path $IndexHtml)) {
    Write-Host "Build did not produce dist/index.html"
    exit 1
}
Write-Host "Build produced dist/index.html"

$Existing = ""
if (Test-Path $ChangelogPath) {
    $Existing = Get-Content $ChangelogPath -Raw
}
$HasEntry = $false
if ($Existing -and $Existing.Contains("## [$Version]")) {
    $HasEntry = $true
}

if ($HasEntry) {
    Write-Host "CHANGELOG.md already has an entry for $Version, skipping PR."
} else {
    $Branch = "release/changelog-v$Version"
    $CurrentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
    Write-Host "+ git checkout -B $Branch"
    git checkout -B $Branch

    $Entry = @"
## [$Version] - unreleased

### Added
- Astro static homepage that renders one of five quotes, chosen deterministically at build time.
- src/lib/pick.ts deterministic seeded picker.
- src/styles/print.css print stylesheet (black on white, 12pt serif body).
- README documentation for install/build usage and adding a new quote.

"@

    $NewContent = $Entry + $Existing
    if (-not $Existing) {
        $NewContent = "# Changelog`n`n" + $Entry
    }
    Set-Content -Path $ChangelogPath -Value $NewContent -NoNewline

    git add CHANGELOG.md
    git commit -m "docs: add changelog for v$Version"
    git push -u origin $Branch

    gh pr create --title "docs: changelog for v$Version" --body "Adds the CHANGELOG.md entry for release v$Version." --base $CurrentBranch --head $Branch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "gh pr create failed or PR already exists, continuing."
    }

    git checkout $CurrentBranch
}

$ExistingTags = git tag --list $Tag
if ($ExistingTags) {
    Write-Host "Tag $Tag already exists locally, skipping tag creation."
} else {
    Write-Host "+ git tag -a $Tag"
    git tag -a $Tag -m "e2e quote page $Version"
}
Write-Host "+ git push origin $Tag"
git push origin $Tag

$Archive = Join-Path $RepoRoot "dist-$Tag.zip"
if (Test-Path $Archive) { Remove-Item $Archive -Force }
Compress-Archive -Path (Join-Path $DistDir "*") -DestinationPath $Archive
Write-Host "Packaged $Archive"

gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists, skipping creation."
} else {
    gh release create $Tag $Archive --title "e2e quote page $Version" --notes "See CHANGELOG.md for details."
}

Write-Host "Release $Tag complete."
