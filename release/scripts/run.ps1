# Run the mdpdf CLI against the bundled sample.md as a smoke test.
# Installs mdpdf in editable mode if not already on PATH, converts
# sample.md to sample.html, and prints where the file was written.
# Run from the repository root. Idempotent: safe to re-run at any time.

$ErrorActionPreference = "Stop"

if (-not (Get-Command mdpdf -ErrorAction SilentlyContinue)) {
    Write-Host "mdpdf is not installed; installing in editable mode"
    Write-Host "+ pip install -e ."
    pip install -e .
}

if (-not (Test-Path "sample.md")) {
    Write-Error "sample file not found at $(Get-Location)\sample.md"
    exit 1
}

Write-Host "+ mdpdf sample.md -o sample.html"
mdpdf sample.md -o sample.html

Write-Host "wrote $(Get-Location)\sample.html"
Write-Host "open it in a browser and use Print -> Save as PDF to export a PDF"
