# run.ps1 -- Serve the game locally on http://localhost:8080 and open it.
# Run from the repository root. Requires Python 3 on PATH.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Port = 8080
$Url = "http://localhost:$Port/index.html"

# Resolve repo root (two levels up from release/scripts/)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '../..')

Set-Location $RepoRoot
Write-Host "Serving $RepoRoot on $Url"

$serverJob = Start-Job -ScriptBlock {
    param($root, $port)
    Set-Location $root
    python3 -m http.server $port
} -ArgumentList $RepoRoot, $Port

Write-Host "Server job started (ID: $($serverJob.Id))"
Start-Sleep -Seconds 1
Write-Host "Opening $Url in default browser..."
Start-Process $Url
Write-Host "Press Ctrl+C to stop the server."
try {
    Wait-Job $serverJob
} finally {
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    Write-Host "Server stopped."
}
