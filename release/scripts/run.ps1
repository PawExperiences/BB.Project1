# run.ps1 - Serve the game locally on http://localhost:8080 and open in browser.
# Use when file:// ES module loading is blocked by browser security policy.
# Run from the repository root.

$ErrorActionPreference = 'Stop'
$Port = 8080
$Url = "http://localhost:$Port/index.html"

# Change to repo root (two levels up from release/scripts/)
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..') 
Set-Location $RepoRoot

Write-Host "[run.ps1] Serving e2e Space Invaders at $Url"
Write-Host "  Press Ctrl+C to stop."

# Use Python's built-in HTTP server
$python = $null
if (Get-Command python3 -ErrorAction SilentlyContinue) { $python = 'python3' }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $python = 'python' }
else {
    Write-Error 'python3 or python is required to run the local server.'
    exit 1
}

# Open browser after a short delay
$job = Start-Job -ScriptBlock {
    param($u)
    Start-Sleep -Seconds 1
    Start-Process $u
} -ArgumentList $Url

try {
    & $python -m http.server $Port
} finally {
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    Write-Host '[run.ps1] Server stopped.'
}
