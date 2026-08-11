# Run script for factorlib.
# Ensures factorlib is installed (editable install from the repo) and
# then invokes the factorlib console script with any arguments passed
# to this script. Run this to try the CLI end-to-end, e.g.:
#   powershell -File release\scripts\run.ps1 12 18 7
# With no arguments, prints usage instead of running.

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '..\..')

if ($args.Count -eq 0) {
    Write-Host 'usage: run.ps1 N1 [N2 ...]  (prints prime factors of each integer via the factorlib CLI)'
    exit 0
}

python -c 'import factorlib' *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host '-- factorlib not importable, installing editable package --'
    python -m pip install -e "$RepoRoot"
    if ($LASTEXITCODE -ne 0) { throw 'pip install -e failed' }
}

$exe = Get-Command factorlib -ErrorAction SilentlyContinue
if (-not $exe) {
    Write-Error "'factorlib' console script not found on PATH after install"
    exit 1
}

Write-Host "+ factorlib $($args -join ' ')"
& factorlib @args
exit $LASTEXITCODE
