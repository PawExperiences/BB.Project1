# run.ps1 -- build (if necessary) and run prime_tester.
#
# Usage: pwsh release/scripts/run.ps1 -- 7 42 97
# Run from the repository root.

$ErrorActionPreference = 'Stop'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot   = (Resolve-Path (Join-Path $ScriptDir '../..')).Path
$BuildDir   = Join-Path $RepoRoot 'build'
$ExePath    = Join-Path $BuildDir 'prime_tester.exe'
if (-not (Test-Path $ExePath)) {
    # Fallback for non-Windows naming
    $ExePath = Join-Path $BuildDir 'prime_tester'
}

# Strip leading '--' separator if present
$PassArgs = $args
if ($PassArgs.Count -gt 0 -and $PassArgs[0] -eq '--') {
    $PassArgs = $PassArgs[1..($PassArgs.Count - 1)]
}

if (-not (Test-Path $ExePath)) {
    Write-Host "[run] Building prime_tester ..."
    & cmake -B $BuildDir $RepoRoot
    if ($LASTEXITCODE -ne 0) { Write-Error 'cmake configure failed'; exit 1 }
    & cmake --build $BuildDir
    if ($LASTEXITCODE -ne 0) { Write-Error 'cmake build failed'; exit 1 }
    Write-Host "[run] Build complete."
    # Re-resolve exe path after build
    $ExePath = Join-Path $BuildDir 'prime_tester.exe'
    if (-not (Test-Path $ExePath)) { $ExePath = Join-Path $BuildDir 'prime_tester' }
}

Write-Host "[run] Executing: $ExePath $PassArgs"
& $ExePath @PassArgs
exit $LASTEXITCODE
