# release.ps1 -- Tag v0.1.0, build prime_tester, publish GitHub Release.
# Run once after CI passes on the release commit.
$ErrorActionPreference = 'Stop'

$Tag           = 'v0.1.0'
$Commit        = 'f7a4f1c'
$Title         = 'e2e prime tester 0.1.0'
$Artifact      = Join-Path 'build' 'prime_tester.exe'
$ReleaseNotes  = Join-Path 'release' 'RELEASE_NOTES.md'

function Invoke-Step([string]$Description, [scriptblock]$Block) {
    Write-Host "[release.ps1] $Description"
    & $Block
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        Write-Error "[release.ps1] Step failed: $Description"
        exit $LASTEXITCODE
    }
}

Invoke-Step "Tagging $Tag at $Commit" {
    git tag -a $Tag $Commit -m "Release $Title"
    git push origin $Tag
}
Write-Host "[release.ps1] Tag $Tag pushed."

Invoke-Step 'Building (CMake Release)' {
    cmake -B build -DCMAKE_BUILD_TYPE=Release
    cmake --build build --config Release
}

# On Linux/macOS running via pwsh, the artifact has no extension
$ArtifactLinux = Join-Path 'build' 'prime_tester'
if (Test-Path $ArtifactLinux) { $Artifact = $ArtifactLinux }

if (-not (Test-Path $Artifact)) {
    Write-Error "[release.ps1] ERROR: artifact not found at $Artifact"
    exit 1
}
Write-Host "[release.ps1] Artifact built: $Artifact"

Invoke-Step 'Publishing GitHub Release' {
    if (Test-Path $ReleaseNotes) {
        gh release create $Tag $Artifact --title $Title --notes-file $ReleaseNotes
    } else {
        gh release create $Tag $Artifact --title $Title --notes $Title
    }
}
Write-Host "[release.ps1] GitHub Release $Tag published."
