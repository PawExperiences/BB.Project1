# Run script for e2e space invaders.
# Opens index.html in the default system browser via a file:// URL.
# Run from the repository root -- no server required.

$ErrorActionPreference = 'Stop'

$Index = Join-Path (Get-Location) 'index.html'
if (-not (Test-Path $Index)) {
    Write-Error 'ERROR: index.html not found. Run from the repository root.'
    exit 1
}

$Url = 'file:///' + $Index.Replace('\', '/')
Write-Host "[run] Opening game: $Url"
Start-Process $Url
Write-Host '[run] Browser launched. No server process to manage.'
