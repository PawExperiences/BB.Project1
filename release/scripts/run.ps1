# release/scripts/run.ps1
# Purpose: run the greet CLI, forwarding any arguments given to this
# script. Use this to try the release artifact locally, e.g.
#   .\release\scripts\run.ps1 Alice Bob
#   .\release\scripts\run.ps1 --help

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$GreetJs = Join-Path $RepoRoot "greet.js"

if (-not (Test-Path $GreetJs)) {
    Write-Error "$GreetJs not found."
    exit 1
}

Write-Host "==> Running: node greet.js $($args -join ' ')"
node $GreetJs @args
exit $LASTEXITCODE
