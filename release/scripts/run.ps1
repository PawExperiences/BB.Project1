# run.ps1 -- Open index.html in the default browser via a file:// URL.
# Run from the repository root. No server required.

$ErrorActionPreference = 'Stop'

$IndexPath = Join-Path (Get-Location) 'index.html'

if (-not (Test-Path $IndexPath)) {
    Write-Error 'index.html not found in the current directory. Run this script from the repository root.'
    exit 1
}

$Url = 'file:///' + ($IndexPath -replace '\\', '/')
Write-Host "[run] Opening $Url"
Start-Process $Url
Write-Host '[run] Game launched in default browser.'
