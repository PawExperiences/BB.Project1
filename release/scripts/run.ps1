# Start the built csvclean CLI.
#
# Ensures csvclean is installed (editable install from the repo if the
# csvclean command is not already on PATH) and then invokes csvclean,
# forwarding any arguments given to this script. With no arguments, shows
# --help.
#
# Usage:
#   powershell -File release\scripts\run.ps1 [csvclean args...]
#   powershell -File release\scripts\run.ps1 sample.csv -o cleaned.csv

$CsvCleanCmd = Get-Command csvclean -ErrorAction SilentlyContinue
if (-not $CsvCleanCmd) {
    Write-Host "-- csvclean not on PATH, installing with 'pip install -e .' --"
    python -m pip install -e .
}

if ($args.Count -eq 0) {
    $CliArgs = @("--help")
} else {
    $CliArgs = $args
}

Write-Host ("+ csvclean " + ($CliArgs -join " "))
csvclean @CliArgs
