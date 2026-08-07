# release.ps1 -- tag, push, create GitHub Release draft, upload artifact.
# Run after CI is green and the build artifact exists.
# Required env vars: GITHUB_TOKEN, GITHUB_REPO (owner/repo), RELEASE_VERSION, ARTIFACT_PATH.
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Require-Env([string]$Name) {
    $val = [System.Environment]::GetEnvironmentVariable($Name)
    if (-not $val) { Write-Error "ERROR: $Name is not set."; exit 1 }
    return $val
}

$Token        = Require-Env 'GITHUB_TOKEN'
$Repo         = Require-Env 'GITHUB_REPO'
$Version      = Require-Env 'RELEASE_VERSION'
$ArtifactPath = Require-Env 'ARTIFACT_PATH'
$Tag          = "v$Version"
$Api          = 'https://api.github.com'
$Headers      = @{ Authorization = "token $Token"; Accept = 'application/vnd.github+json' }

# 1. Create annotated tag (idempotent)
Write-Host "[release.ps1] Creating annotated tag $Tag ..."
$tagOut = & git tag -a $Tag -m "Release $Tag" 2>&1
if ($LASTEXITCODE -ne 0) {
    if ($tagOut -match 'already exists') {
        Write-Host "[release.ps1] Tag $Tag already exists, skipping."
    } else {
        Write-Error $tagOut; exit 1
    }
} else {
    Write-Host "[release.ps1] Tag $Tag created."
}

# 2. Push tag
Write-Host "[release.ps1] Pushing tag $Tag to origin ..."
& git push origin $Tag 2>&1 | ForEach-Object { Write-Host $_ }

# 3. Create GitHub Release draft
$ChangelogBody = "## e2e prime tester $Version -- Initial Release

### Added
- prime_tester C++17 console app with 6k+-1 trial division.
- Dual input mode (argv / stdin).
- Robust error handling; exit code 1 on invalid tokens.
- README with build instructions and worked-examples table.
- CHANGELOG, CONTRIBUTING, RELEASING docs added.
- CI workflow updated for C++17/CMake.
- Release and run helper scripts."

$Body = @{
    tag_name   = $Tag
    name       = "e2e prime tester $Version"
    body       = $ChangelogBody
    draft      = $true
    prerelease = $false
} | ConvertTo-Json

Write-Host "[release.ps1] Creating GitHub Release draft ..."
$Release = Invoke-RestMethod -Method Post -Uri "$Api/repos/$Repo/releases" -Headers $Headers -Body $Body -ContentType 'application/json'
$UploadUrl = $Release.upload_url -replace '\{.*\}', ''
Write-Host "[release.ps1] Draft release created. Upload URL: $UploadUrl"

# 4. Upload artifact
if (-not (Test-Path $ArtifactPath)) { Write-Error "Artifact not found at $ArtifactPath"; exit 1 }
$ArtifactName = [System.IO.Path]::GetFileName($ArtifactPath)
Write-Host "[release.ps1] Uploading artifact $ArtifactName ..."
$UploadHeaders = $Headers.Clone()
$UploadHeaders['Content-Type'] = 'application/octet-stream'
$ArtifactBytes = [System.IO.File]::ReadAllBytes($ArtifactPath)
Invoke-RestMethod -Method Post -Uri "${UploadUrl}?name=$ArtifactName" -Headers $UploadHeaders -Body $ArtifactBytes | Out-Null
Write-Host "[release.ps1] Artifact uploaded."
Write-Host "[release.ps1] Done. Review and publish the draft at: https://github.com/$Repo/releases"
