# run.ps1 -- locate and launch the prime_tester binary.
# Forwards all arguments to the binary. Run after `cmake --build build`.
# Usage: pwsh release/scripts/run.ps1 [numbers or tokens]
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Args)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Candidates = @(
    'build\prime_tester.exe',
    'build/prime_tester',
    'build\Release\prime_tester.exe',
    'build\Debug\prime_tester.exe'
)

$Binary = $null
foreach ($c in $Candidates) {
    if (Test-Path $c) { $Binary = $c; break }
}

if (-not $Binary) {
    Write-Error 'ERROR: prime_tester binary not found. Run `cmake -B build && cmake --build build` first.'
    exit 1
}

Write-Host "[run.ps1] Launching: $Binary $Args"
& $Binary @Args
exit $LASTEXITCODE
