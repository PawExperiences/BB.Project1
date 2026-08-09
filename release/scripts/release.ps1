# release.ps1 - Creates a GitHub Release for e2e space invaders 0.1.0 and uploads the artifact.
# Run AFTER pushing the v0.1.0 tag. Requires env var GITHUB_TOKEN with repo write scope.

$ErrorActionPreference = 'Stop'

$Repo = 'PawExperiences/BB.Project1'
$Tag = 'v0.1.0'
$ReleaseName = 'e2e space invaders 0.1.0'
$ArtifactName = 'e2e-space-invaders-0.1.0.zip'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '../..')
$SourceFiles = @('index.html','main.js','style.css','game.js','gameConfig.js','input.js','player.js','invaders.js','collision.js','level1.js','level2.js','level3.js','boss.js','README.md')

$Token = $env:GITHUB_TOKEN
if (-not $Token) {
    Write-Error 'ERROR: GITHUB_TOKEN is not set'
    exit 1
}

$Headers = @{
    'Authorization' = "Bearer $Token"
    'Accept' = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}

Write-Host "Checking for existing release $Tag..."
$ReleaseUrl = "https://api.github.com/repos/$Repo/releases/tags/$Tag"
$ExistingRelease = $null
try {
    $ExistingRelease = Invoke-RestMethod -Uri $ReleaseUrl -Headers $Headers -Method Get
} catch {
    $ExistingRelease = $null
}

if ($ExistingRelease -and $ExistingRelease.id) {
    Write-Host 'Release already exists. Skipping creation.'
    $UploadUrl = $ExistingRelease.upload_url
} else {
    Write-Host "Creating release $Tag..."
    $Body = @{
        tag_name = $Tag
        name = $ReleaseName
        body = 'First playable release. Open index.html in any modern browser from the filesystem and press Enter to play.'
        draft = $false
        prerelease = $false
    } | ConvertTo-Json
    $Created = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases" -Headers $Headers -Method Post -Body $Body -ContentType 'application/json'
    Write-Host "Release created: $($Created.html_url)"
    $UploadUrl = $Created.upload_url
}

$ZipPath = Join-Path $ScriptDir $ArtifactName
Write-Host "Building artifact $ArtifactName..."
$FilesToZip = $SourceFiles | ForEach-Object {
    $p = Join-Path $RepoRoot $_
    if (Test-Path $p) { $p } else { Write-Host "  WARNING: $_ not found, skipping" }
} | Where-Object { $_ }
if (Test-Path $ZipPath) { Remove-Item $ZipPath }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$Archive = [System.IO.Compression.ZipFile]::Open($ZipPath, 'Create')
foreach ($File in $FilesToZip) {
    $EntryName = Split-Path -Leaf $File
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($Archive, $File, $EntryName) | Out-Null
    Write-Host "  added $EntryName"
}
$Archive.Dispose()
Write-Host "Artifact built: $ZipPath"

$BaseUploadUrl = $UploadUrl -replace '\{.*\}',''
$UploadUri = "${BaseUploadUrl}?name=${ArtifactName}"
Write-Host "Uploading $ArtifactName..."
$UploadHeaders = $Headers.Clone()
$UploadHeaders['Content-Type'] = 'application/zip'
$FileBytes = [System.IO.File]::ReadAllBytes($ZipPath)
Invoke-RestMethod -Uri $UploadUri -Headers $UploadHeaders -Method Post -Body $FileBytes | Out-Null
Write-Host 'Asset uploaded.'
Write-Host 'Done.'
