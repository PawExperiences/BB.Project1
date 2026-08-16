# Run the built prime_tester CLI, building it first if needed.
# Usage: powershell -File release/scripts/run.ps1 [prime_tester args...]
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$BuildDir = $env:BUILD_DIR
if (-not $BuildDir) { $BuildDir = "build" }
$BuildPath = Join-Path $RepoRoot $BuildDir
$Binary = Join-Path $BuildPath "prime_tester.exe"
if (-not (Test-Path $Binary)) {
    $Binary = Join-Path $BuildPath "prime_tester"
}

if (-not (Test-Path $Binary)) {
    $CMakeListsPath = Join-Path $RepoRoot "CMakeLists.txt"
    if (-not (Test-Path $CMakeListsPath)) {
        Write-Error "no CMakeLists.txt at $RepoRoot and no built binary at $Binary -- nothing to run yet"
        exit 1
    }
    Write-Host "$Binary not found -- building it first"
    & cmake -S $RepoRoot -B $BuildPath
    & cmake --build $BuildPath
}

Write-Host "+ $Binary $($args -join ' ')"
& $Binary @args
exit $LASTEXITCODE
