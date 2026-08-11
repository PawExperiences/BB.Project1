# release/scripts/run.ps1
# Purpose: build prime_tester if it hasn't been built yet, then run it,
# forwarding all CLI arguments and stdin unchanged. Use this for local/manual
# runs of the shipped CLI (argv mode, stdin mode, or --upto N mode).
# Usage: powershell -File release/scripts/run.ps1 [args...]

$ErrorActionPreference = "Stop"
$BuildDir = "build"

function Find-Binary {
    $candidates = @(
        (Join-Path $BuildDir "prime_tester.exe"),
        (Join-Path $BuildDir (Join-Path "Release" "prime_tester.exe")),
        (Join-Path $BuildDir "prime_tester"),
        (Join-Path $BuildDir (Join-Path "Release" "prime_tester"))
    )
    foreach ($c in $candidates) {
        if (Test-Path $c -PathType Leaf) { return $c }
    }
    return $null
}

$Binary = Find-Binary
if (-not $Binary) {
    Write-Host "No build found under $BuildDir; configuring and building first."
    cmake -B $BuildDir
    if ($LASTEXITCODE -ne 0) { exit 1 }
    cmake --build $BuildDir
    if ($LASTEXITCODE -ne 0) { exit 1 }
    $Binary = Find-Binary
}
if (-not $Binary) {
    Write-Error "ERROR: build succeeded but executable was not found under $BuildDir"
    exit 1
}

Write-Host "Running: $Binary $args"
& $Binary @args
exit $LASTEXITCODE
