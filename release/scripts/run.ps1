# Installs factorlib (editable, if not already installed) and runs its CLI with the given arguments.
# Usage: .\run.ps1 <int> [<int> ...]
# If no arguments are given, runs a smoke-test call: factorlib 12 17.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

python -c "import factorlib" *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "factorlib is not installed; installing in editable mode ..."
    python -m pip install -e $RepoRoot
} else {
    Write-Host "factorlib is already installed"
}

$FactorlibCmd = Get-Command factorlib -ErrorAction SilentlyContinue
if (-not $FactorlibCmd) {
    Write-Error "the factorlib console script was not found on PATH after install"
    exit 1
}

if ($args.Count -gt 0) {
    Write-Host "+ factorlib $($args -join ' ')"
    & factorlib @args
} else {
    Write-Host "+ factorlib 12 17"
    & factorlib 12 17
}
exit $LASTEXITCODE
