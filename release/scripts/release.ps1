# release.ps1 — tag, build, package, and publish prime_tester 0.3.0 to GitHub Releases.
$ErrorActionPreference = 'Stop'

$Version   = '0.3.0'
$Tag       = "v$Version"
$Repo      = 'PawExperiences/BB.Project1'
$BuildDir  = 'build'
$DistDir   = 'dist'
$Archive   = "prime_tester-$Version-windows.zip"

Write-Host '=== 1. Tag ==='
git fetch --tags
$tagExists = git tag -l $Tag
if ($tagExists) {
    Write-Host "Tag $Tag already exists -- skipping."
} else {
    git tag -a $Tag -m "Release e2e prime tester $Version"
    git push origin $Tag
}

Write-Host '=== 2. Build ==='
if (-not (Test-Path $BuildDir)) { New-Item -ItemType Directory -Path $BuildDir | Out-Null }
cmake -B $BuildDir -DCMAKE_BUILD_TYPE=Release
cmake --build $BuildDir --config Release

Write-Host '=== 3. Locate executable ==='
$ExeCandidates = @(
    Join-Path $BuildDir 'Release\prime_tester.exe',
    Join-Path $BuildDir 'prime_tester.exe'
)
$Exe = $ExeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Exe) {
    Write-Error 'ERROR: built executable not found.'
    exit 1
}
Write-Host "Found: $Exe"

Write-Host '=== 4. Package ==='
if (-not (Test-Path $DistDir)) { New-Item -ItemType Directory -Path $DistDir | Out-Null }
$ArchivePath = Join-Path $DistDir $Archive
Compress-Archive -Path $Exe -DestinationPath $ArchivePath -Force
Write-Host "Packaged: $ArchivePath"

Write-Host '=== 5. Publish GitHub Release ==='
gh release create $Tag `
    --repo $Repo `
    --title "e2e prime tester $Version" `
    --notes "Release $Version of the e2e prime tester project." `
    $ArchivePath
Write-Host 'Done.'
