# Release script for e2e standup poster.
# Performs the automated release steps: build, tag, push tag, create/update
# the GitHub Release, and upload the build artifact. Safe to re-run. Never
# deletes or force-pushes anything.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
Set-Location $RepoRoot

if (-not $env:VERSION) { $env:VERSION = "0.1.0" }
if (-not $env:TAG) { $env:TAG = "v$($env:VERSION)" }
if (-not $env:REMOTE) { $env:REMOTE = "origin" }
if (-not $env:TARGET_BRANCH) { $env:TARGET_BRANCH = "main" }
if (-not $env:RELEASE_TITLE) { $env:RELEASE_TITLE = "e2e standup poster $($env:VERSION)" }

$DistDir = Join-Path $RepoRoot "dist"
$NotesFile = Join-Path $RepoRoot "release\RELEASE_NOTES.md"
$Artifact = Join-Path $RepoRoot ("release\e2e-standup-poster-" + $env:VERSION + ".zip")

Write-Host "== Releasing e2e standup poster $($env:VERSION) ($($env:TAG)) =="

Write-Host "== Step 1/4: install dependencies and build =="
Write-Host "+ npm ci"
npm ci
Write-Host "+ npm run build"
npm run build
$IndexHtml = Join-Path $DistDir "index.html"
if (-not (Test-Path $IndexHtml)) {
    Write-Error ("ERROR: " + $IndexHtml + " was not produced by the build")
    exit 1
}
Write-Host ("OK: " + $IndexHtml + " exists")

Write-Host "== Step 2/4: create and push git tag $($env:TAG) =="
git rev-parse -q --verify ("refs/tags/" + $env:TAG) *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "SKIP: tag $($env:TAG) already exists locally"
} else {
    Write-Host "+ git tag $($env:TAG)"
    git tag $env:TAG
}
Write-Host "+ git push $($env:REMOTE) $($env:TAG)"
git push $env:REMOTE $env:TAG

Write-Host "== Step 3/4: package the build artifact =="
New-Item -ItemType Directory -Force -Path (Split-Path $Artifact) | Out-Null
if (Test-Path $Artifact) { Remove-Item -Force $Artifact -Confirm:$false }
Compress-Archive -Path (Join-Path $DistDir "*") -DestinationPath $Artifact
Write-Host ("OK: wrote " + $Artifact)

Write-Host "== Step 4/4: create or update the GitHub Release =="
gh release view $env:TAG *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "SKIP: GitHub release $($env:TAG) already exists, uploading artifact only"
} else {
    if (Test-Path $NotesFile) {
        Write-Host "+ gh release create $($env:TAG) --notes-file $NotesFile"
        gh release create $env:TAG --title $env:RELEASE_TITLE --target $env:TARGET_BRANCH --notes-file $NotesFile
    } else {
        Write-Host "+ gh release create $($env:TAG) --notes Release-$($env:TAG)"
        gh release create $env:TAG --title $env:RELEASE_TITLE --target $env:TARGET_BRANCH --notes ("Release " + $env:TAG)
    }
}
Write-Host "+ gh release upload $($env:TAG) $Artifact --clobber"
gh release upload $env:TAG $Artifact --clobber

Write-Host "== Done. Nothing was deleted or force-pushed. =="
