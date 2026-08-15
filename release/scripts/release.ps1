$ErrorActionPreference = "Stop"

$Version = if ($env:CALTOOL_VERSION) { $env:CALTOOL_VERSION } else { "0.1.0" }
$Tag = "v$Version"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$PublishDir = Join-Path $ProjectDir "out"
$ArtifactZip = Join-Path $ProjectDir "caltool-$Version.zip"
$NotesFile = Join-Path $ProjectDir "release\RELEASE_NOTES.md"

Set-Location $ProjectDir

Write-Host "[release] Preparing release $Tag for caltool"

Write-Host "[release] Restoring, building, and testing (gate before publish)"
dotnet restore caltool.csproj
if ($LASTEXITCODE -ne 0) { Write-Host "[release] FAILED: dotnet restore"; exit $LASTEXITCODE }
dotnet build caltool.csproj -c Release
if ($LASTEXITCODE -ne 0) { Write-Host "[release] FAILED: dotnet build"; exit $LASTEXITCODE }
dotnet test (Join-Path "tests" "CalendarTests.csproj")
if ($LASTEXITCODE -ne 0) { Write-Host "[release] FAILED: dotnet test"; exit $LASTEXITCODE }

Write-Host "[release] Publishing to $PublishDir"
if (Test-Path $PublishDir) { Remove-Item -Recurse -Force $PublishDir }
dotnet publish caltool.csproj -c Release -o $PublishDir
if ($LASTEXITCODE -ne 0) { Write-Host "[release] FAILED: dotnet publish"; exit $LASTEXITCODE }

Write-Host "[release] Packaging artifact $ArtifactZip"
if (Test-Path $ArtifactZip) { Remove-Item -Force $ArtifactZip }
Compress-Archive -Path (Join-Path $PublishDir "*") -DestinationPath $ArtifactZip

$existingTag = git tag --list $Tag
if ($existingTag -eq $Tag) {
    Write-Host "[release] Tag $Tag already exists locally, skipping tag creation"
} else {
    Write-Host "[release] Creating annotated tag $Tag"
    git tag -a $Tag -m "caltool $Version"
}

Write-Host "[release] Pushing tag $Tag to origin (safe no-op if already present)"
git push origin $Tag
if ($LASTEXITCODE -ne 0) { Write-Host "[release] Tag push reported non-zero exit (likely already up to date)" }

$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghAvailable) {
    Write-Host "[release] gh CLI not found; skipping GitHub release creation."
    Write-Host "[release] Create it manually: attach $ArtifactZip and use release\RELEASE_NOTES.md as the body."
    exit 0
}

gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[release] GitHub release $Tag already exists, skipping creation"
} else {
    Write-Host "[release] Creating GitHub release $Tag"
    if (Test-Path $NotesFile) {
        gh release create $Tag $ArtifactZip --title "caltool $Version" --notes-file $NotesFile
    } else {
        gh release create $Tag $ArtifactZip --title "caltool $Version" --notes "caltool $Version"
    }
}

Write-Host "[release] Done."
