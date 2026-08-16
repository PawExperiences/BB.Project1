# BuildBoard release helper: tags, builds and publishes a GitHub Release.
# Usage: $env:GITHUB_TOKEN = "xxxx"; powershell -File release/scripts/release.ps1
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$Version = $env:RELEASE_VERSION
if (-not $Version) { $Version = "0.6.0" }
$Repo = $env:GITHUB_REPO
if (-not $Repo) { $Repo = "PawExperiences/BB.Project1" }
$BuildDir = $env:BUILD_DIR
if (-not $BuildDir) { $BuildDir = "build" }
$NotesFile = $env:RELEASE_NOTES_FILE
if (-not $NotesFile) { $NotesFile = "RELEASE_NOTES.md" }
$Api = "https://api.github.com"

Write-Host "== releasing $Version for $Repo =="

# 1. tag (idempotent)
$existingTags = & git -C $RepoRoot tag --list $Version
if ($existingTags -contains $Version) {
    Write-Host "tag $Version already exists locally -- skipping"
} else {
    Write-Host "+ git tag -a $Version"
    & git -C $RepoRoot tag -a $Version -m "Release $Version"
}
$remoteTags = & git -C $RepoRoot ls-remote --tags origin $Version
if ($remoteTags -match "refs/tags/$Version") {
    Write-Host "tag $Version already on origin -- skipping push"
} else {
    Write-Host "+ git push origin refs/tags/$Version"
    & git -C $RepoRoot push origin "refs/tags/$Version"
}

# 2. build (skipped with a message if there is nothing to build yet)
$Artifact = $null
$CMakeListsPath = Join-Path $RepoRoot "CMakeLists.txt"
if (Test-Path $CMakeListsPath) {
    $BuildPath = Join-Path $RepoRoot $BuildDir
    Write-Host "+ cmake -S $RepoRoot -B $BuildPath -DCMAKE_BUILD_TYPE=Release"
    & cmake -S $RepoRoot -B $BuildPath -DCMAKE_BUILD_TYPE=Release
    Write-Host "+ cmake --build $BuildPath"
    & cmake --build $BuildPath
    $Artifact = Join-Path $RepoRoot ("$BuildDir-$Version.zip")
    if (Test-Path $Artifact) {
        Write-Host "$(Split-Path -Leaf $Artifact) already exists -- reusing it"
    } else {
        Write-Host "+ Compress-Archive $BuildDir -> $(Split-Path -Leaf $Artifact)"
        Compress-Archive -Path (Join-Path $BuildPath "*") -DestinationPath $Artifact -Force
    }
} else {
    Write-Host "no CMakeLists.txt at $RepoRoot -- nothing to build; publishing without a binary asset"
}

# 3. publish the GitHub release (idempotent)
if (-not $env:GITHUB_TOKEN) {
    Write-Error "GITHUB_TOKEN is not set -- export a token with Contents: read/write and retry"
    exit 1
}
$Headers = @{
    Authorization = "Bearer $($env:GITHUB_TOKEN)"
    Accept        = "application/vnd.github+json"
}

$Release = $null
try {
    $Release = Invoke-RestMethod -Method Get -Uri "$Api/repos/$Repo/releases/tags/$Version" -Headers $Headers
    Write-Host "GitHub release $Version already exists -- reusing it"
} catch {
    $Body = "Release $Version."
    $NotesPath = Join-Path $RepoRoot $NotesFile
    if (Test-Path $NotesPath) { $Body = Get-Content $NotesPath -Raw }
    $Payload = @{
        tag_name   = $Version
        name       = "e2e prime tester cc $Version"
        body       = $Body
        draft      = $false
        prerelease = $false
    } | ConvertTo-Json
    Write-Host "+ POST /repos/$Repo/releases"
    $Release = Invoke-RestMethod -Method Post -Uri "$Api/repos/$Repo/releases" -Headers $Headers -Body $Payload -ContentType "application/json"
    Write-Host "created GitHub release $Version (id $($Release.id))"
}

# 4. upload the artifact (idempotent, skipped if none was built)
if ($Artifact -and (Test-Path $Artifact)) {
    $AssetName = Split-Path -Leaf $Artifact
    $AlreadyAttached = $Release.assets | Where-Object { $_.name -eq $AssetName }
    if ($AlreadyAttached) {
        Write-Host "asset $AssetName already attached -- skipping upload"
    } else {
        $UploadUrl = $Release.upload_url -replace '\{.*\}', ''
        Write-Host "+ uploading $AssetName"
        Invoke-RestMethod -Method Post -Uri "$UploadUrl?name=$AssetName" -Headers $Headers -ContentType "application/zip" -InFile $Artifact | Out-Null
    }
}

Write-Host "== done =="
