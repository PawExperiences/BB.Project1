# run.ps1 -- Build (if needed) and run the e2e prime tester console app.
# Usage: .\release\scripts\run.ps1 [args to pass to the binary]
# Example: .\release\scripts\run.ps1 97
$ErrorActionPreference = 'Stop'

$BUILD_DIR = 'build'
$BINARY_NAME = 'prime_tester'

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot
Write-Host "[run.ps1] Working directory: $RepoRoot"

# Locate binary
$BinaryPath = $null
$Candidates = @(
    "$BUILD_DIR\$BINARY_NAME.exe",
    "$BUILD_DIR\Release\$BINARY_NAME.exe",
    "$BUILD_DIR\$BINARY_NAME",
    "$BUILD_DIR\Release\$BINARY_NAME"
)
foreach ($c in $Candidates) {
    if (Test-Path $c) {
        $BinaryPath = $c
        break
    }
}

if ($null -eq $BinaryPath) {
    Write-Host "[run.ps1] Binary not found -- building with CMake..."
    cmake -B $BUILD_DIR -S . -DCMAKE_BUILD_TYPE=Release
    cmake --build $BUILD_DIR --config Release
    foreach ($c in $Candidates) {
        if (Test-Path $c) {
            $BinaryPath = $c
            break
        }
    }
}

if ($null -eq $BinaryPath) {
    Write-Host "[run.ps1] ERROR: Could not locate binary '$BINARY_NAME' after build."
    exit 1
}

Write-Host "[run.ps1] Running: $BinaryPath $args"
& $BinaryPath @args
exit $LASTEXITCODE
