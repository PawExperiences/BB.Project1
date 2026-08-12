# release/scripts/run.ps1
# Runs the e2e-cli-greeter CLI, forwarding all arguments to greet.js.
# Usage: powershell -File release/scripts/run.ps1 [NAME...]   (or: -File release/scripts/run.ps1 --help)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$GreetJs = Join-Path $RepoRoot "greet.js"

if (-not (Test-Path $GreetJs)) {
    Write-Error "ERROR: $GreetJs not found."
    exit 1
}

Write-Output "-> node $GreetJs $args"
node $GreetJs @args
exit $LASTEXITCODE
