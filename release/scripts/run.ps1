# run.ps1 - serve the Space Invaders game over a local HTTP server and open it in the browser.
# Use when the browser blocks ES module imports from file:// URLs.
# Usage: .\release\scripts\run.ps1 [-Port 8080]
[CmdletBinding()]
param(
    [int]$Port = 8080
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Navigate to repo root (two levels up from release/scripts/)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoRoot  = Resolve-Path (Join-Path $ScriptDir '..\..') | Select-Object -ExpandProperty Path
Set-Location $RepoRoot

Write-Host "Serving $RepoRoot on http://localhost:$Port/"
Write-Host 'Press Ctrl+C to stop.'

# Use python3 if available; otherwise fall back to python
$PythonCmd = $null
foreach ($candidate in @('python3', 'python')) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) {
        $PythonCmd = $candidate
        break
    }
}
if (-not $PythonCmd) {
    Write-Host 'ERROR: python3 or python is required to run the local server.'
    exit 1
}

# Open browser after a short delay
$Url = "http://localhost:$Port/index.html"
Start-Job -ScriptBlock {
    param($u) Start-Sleep -Seconds 1; Start-Process $u
} -ArgumentList $Url | Out-Null

Write-Host "Opening $Url in your default browser ..."
& $PythonCmd -m http.server $Port
