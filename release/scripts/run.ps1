$ErrorActionPreference = 'Stop'

$MdpdfCmd = Get-Command mdpdf -ErrorAction SilentlyContinue
if (-not $MdpdfCmd) {
    Write-Host "-> 'mdpdf' not found on PATH, installing package in editable mode"
    python -m pip install --quiet -e .
}

if ($args.Count -gt 0) {
    Write-Host ('-> Running: mdpdf {0}' -f ($args -join ' '))
    & mdpdf @args
    exit $LASTEXITCODE
}

$OutputPath = 'mdpdf_output.html'
Write-Host '-> No arguments given, converting the bundled sample.md'
Write-Host ('-> Running: mdpdf sample.md -o {0}' -f $OutputPath)
& mdpdf sample.md -o $OutputPath
Write-Host ('-> Wrote {0}' -f $OutputPath)
Write-Host '-> Open it in a browser and use Print > Save as PDF to produce a PDF'
