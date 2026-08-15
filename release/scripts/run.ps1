# Idempotent: ensures the 'linkcheck' console script is installed, then runs
# it against each Markdown file path given as an argument, forwarding its
# exit code. Usage: run.ps1 <markdown-file> [more files...]

$ErrorActionPreference = "Stop"

if ($args.Count -lt 1) {
    Write-Host "[run] usage: run.ps1 <markdown-file> [more files...]"
    exit 2
}

$linkcheckCmd = Get-Command linkcheck -ErrorAction SilentlyContinue
if (-not $linkcheckCmd) {
    Write-Host "[run] 'linkcheck' not found on PATH; installing package with 'pip install .'"
    python -m pip install .
    if ($LASTEXITCODE -ne 0) { throw "pip install . failed" }
} else {
    Write-Host "[run] 'linkcheck' already on PATH"
}

$exitCode = 0
foreach ($target in $args) {
    Write-Host "[run] linkcheck $target"
    linkcheck $target
    $rc = $LASTEXITCODE
    if ($rc -eq 2) {
        exit 2
    } elseif ($rc -eq 1) {
        $exitCode = 1
    }
}

exit $exitCode
