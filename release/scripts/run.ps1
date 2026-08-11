# run.ps1 - build (if needed) and run the prime_tester CLI, forwarding all arguments.
$ErrorActionPreference = "Stop"

$BuildDir = $env:BUILD_DIR
if (-not $BuildDir) { $BuildDir = "build" }

$Artifact = Join-Path $BuildDir "prime_tester.exe"
if (-not (Test-Path $Artifact)) { $Artifact = Join-Path $BuildDir "prime_tester" }

if (-not (Test-Path $Artifact)) {
    Write-Host "==> No build found at $Artifact; configuring and building first"
    cmake -B $BuildDir
    if ($LASTEXITCODE -ne 0) { throw "cmake configure failed" }
    cmake --build $BuildDir
    if ($LASTEXITCODE -ne 0) { throw "cmake build failed" }
    $Artifact = Join-Path $BuildDir "prime_tester.exe"
    if (-not (Test-Path $Artifact)) { $Artifact = Join-Path $BuildDir "prime_tester" }
}

Write-Host "==> Running $Artifact $args"
& $Artifact @args
exit $LASTEXITCODE
