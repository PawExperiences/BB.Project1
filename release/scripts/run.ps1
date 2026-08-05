# run.ps1 - Serve e2e Space Invaders locally and open it in the browser.
# Run from the repository root.
# Starts Python's built-in HTTP server on port 8080.
# Press Ctrl+C to stop.

$ErrorActionPreference = 'Stop'
$PORT = 8080
$URL = "http://localhost:$PORT/index.html"

# Change to repo root (two levels up from release/scripts/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptDir '../..')

Write-Host "[run] Serving at $URL"
Write-Host "[run] Press Ctrl+C to stop."

# Open browser after 1 second in background
$job = Start-Job -ScriptBlock {
    Start-Sleep 1
    Start-Process $using:URL
}

try {
    & python3 -m http.server $PORT
} finally {
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    Write-Host "[run] Server stopped."
}
