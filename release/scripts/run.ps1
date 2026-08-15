$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$PublishDir = Join-Path $ProjectDir "out"
$BinaryPath = Join-Path $PublishDir "caltool.exe"

Set-Location $ProjectDir

if (Test-Path $BinaryPath) {
    Write-Host "[run] Using published binary: $BinaryPath"
    & $BinaryPath @args
    exit $LASTEXITCODE
}

Write-Host "[run] No published binary found in 'out\'; falling back to 'dotnet run'"
if ($args.Count -gt 0) {
    dotnet run --project (Join-Path $ProjectDir "caltool.csproj") -- @args
} else {
    dotnet run --project (Join-Path $ProjectDir "caltool.csproj")
}
exit $LASTEXITCODE
