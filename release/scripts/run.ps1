# run.ps1 -- build (if needed) and run the prime_tester CLI, forwarding
# all arguments. Use it to quickly try the released binary:
#   powershell -File release/scripts/run.ps1 2 4 17
#   powershell -File release/scripts/run.ps1 --upto 30
# Exits with prime_tester's own exit status (1 if any bad token occurred).
$ErrorActionPreference = "Stop"

Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

if (-not (Test-Path "build/CMakeCache.txt")) {
  Write-Host "[run] configuring: cmake -B build"
  cmake -B build
  if ($LASTEXITCODE -ne 0) { throw "cmake configure failed (exit $LASTEXITCODE)" }
}
Write-Host "[run] building: cmake --build build"
cmake --build build
if ($LASTEXITCODE -ne 0) { throw "cmake build failed (exit $LASTEXITCODE)" }

$Exe = $null
foreach ($candidate in @(
    "build/prime_tester.exe", "build/prime_tester",
    "build/Debug/prime_tester.exe", "build/Release/prime_tester.exe",
    "build/Debug/prime_tester", "build/Release/prime_tester")) {
  if (Test-Path $candidate) { $Exe = $candidate; break }
}
if (-not $Exe) { throw "[run] prime_tester binary not found under build/" }

Write-Host "[run] starting: $Exe $args"
& $Exe @args
exit $LASTEXITCODE
