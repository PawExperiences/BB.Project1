# Run the factorlib CLI (console script).
#
# Installs factorlib from this checkout in editable mode if it is not
# already installed, then runs factorlib with any arguments given
# (defaults to "12 18 7" as a demo).
#
# Usage: powershell -File release\scripts\run.ps1 [INT ...]
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

python -c "import factorlib" *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "factorlib is not installed; installing in editable mode from this checkout..."
    python -m pip install --quiet -e $RepoRoot
} else {
    Write-Host "factorlib is already installed."
}

$Cmd = Get-Command factorlib -ErrorAction SilentlyContinue
if ($Cmd) {
    $Exe = $Cmd.Source
} else {
    $PythonDir = Split-Path -Parent (Get-Command python).Source
    $Exe = Join-Path $PythonDir "Scripts\factorlib.exe"
}

if ($args.Count -eq 0) {
    $CliArgs = @("12", "18", "7")
} else {
    $CliArgs = $args
}

Write-Host "==> $Exe $($CliArgs -join ' ')"
& $Exe @CliArgs
exit $LASTEXITCODE
