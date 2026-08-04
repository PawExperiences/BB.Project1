#Requires -Version 5.1
# run.ps1 -- open index.html in the default browser via file:// URL.
# Run from the directory containing index.html. No server is started.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$indexPath = Join-Path (Get-Location) 'index.html'
if (-not (Test-Path $indexPath)) {
    Write-Error "ERROR: index.html not found in $(Get-Location)"
    exit 1
}

$absPath = (Resolve-Path $indexPath).Path
$url = 'file:///' + $absPath.Replace('\', '/')

Write-Host "[run.ps1] Opening $url"
Start-Process $url
Write-Host "[run.ps1] Browser launched."
