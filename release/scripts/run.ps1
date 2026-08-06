# run.ps1 — build (if needed) and launch the prime_tester executable.
$ErrorActionPreference = 'Stop'

$BuildDir = 'build'
$ExeCandidates = @(
    Join-Path $BuildDir 'Release\prime_tester.exe',
    Join-Path $BuildDir 'prime_tester.exe'
)

$Exe = $ExeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $Exe) {
    Write-Host 'Executable not found -- building now...'
    if (-not (Test-Path $BuildDir)) { New-Item -ItemType Directory -Path $BuildDir | Out-Null }
    cmake -B $BuildDir
    cmake --build $BuildDir --config Release
    $Exe = $ExeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $Exe) {
    Write-Error 'ERROR: could not locate prime_tester.exe after build.'
    exit 1
}

$PassArgs = $args
Write-Host "+ $Exe $PassArgs"
& $Exe @PassArgs
exit $LASTEXITCODE
