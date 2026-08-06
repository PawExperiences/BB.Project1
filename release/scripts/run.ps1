# run.ps1 - Build (if needed) and run the prime_tester console app.
# Usage: .\release\scripts\run.ps1 [prime_tester args...]
# Example: .\release\scripts\run.ps1 --range 1 100
[CmdletBinding()]
param([Parameter(ValueFromRemainingArguments)]$AppArgs)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$BuildDir = 'build'
$Binary = Join-Path $BuildDir 'prime_tester.exe'

if (-not (Test-Path $Binary)) {
    Write-Host 'Binary not found -- building first...'
    cmake -S . -B $BuildDir -DCMAKE_BUILD_TYPE=Release
    if ($LASTEXITCODE -ne 0) { throw 'cmake configure failed' }
    cmake --build $BuildDir
    if ($LASTEXITCODE -ne 0) { throw 'cmake build failed' }
} else {
    Write-Host "Using existing binary: $Binary"
}

Write-Host ">>> $Binary $AppArgs"
& $Binary @AppArgs
exit $LASTEXITCODE
