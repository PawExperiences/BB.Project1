# run.ps1 -- Build (if needed) and launch prime_tester.
# Pass integers or tokens as arguments; they are forwarded to the executable.
$ErrorActionPreference = 'Stop'

$Artifact = Join-Path 'build' 'prime_tester.exe'
$ArtifactLinux = Join-Path 'build' 'prime_tester'
if (Test-Path $ArtifactLinux) { $Artifact = $ArtifactLinux }

if (-not (Test-Path $Artifact)) {
    Write-Host '[run.ps1] Artifact not found -- building...'
    cmake -B build -DCMAKE_BUILD_TYPE=Release
    cmake --build build --config Release
    if (Test-Path $ArtifactLinux) { $Artifact = $ArtifactLinux }
    elseif (-not (Test-Path $Artifact)) {
        Write-Error '[run.ps1] Build succeeded but artifact not found.'
        exit 1
    }
}

$UserArgs = $args
Write-Host "[run.ps1] Launching: $Artifact $UserArgs"
& $Artifact @UserArgs
exit $LASTEXITCODE
