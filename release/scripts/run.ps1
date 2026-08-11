# Run the factorlib CLI against the arguments given on the command line.
# Installs factorlib in editable mode if the `factorlib` console script is
# not already on PATH, then invokes it (default args: 12 18 7).

$ErrorActionPreference = "Stop"

$RepoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $RepoRoot

if (-not (Get-Command factorlib -ErrorAction SilentlyContinue)) {
    Write-Host "factorlib console script not found; installing in editable mode..."
    python -m pip install -e .
}

if ($args.Count -eq 0) {
    $CliArgs = @("12", "18", "7")
} else {
    $CliArgs = $args
}

Write-Host "+ factorlib $($CliArgs -join ' ')"
factorlib @CliArgs
exit $LASTEXITCODE
