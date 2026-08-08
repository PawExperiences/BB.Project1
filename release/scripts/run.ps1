# run.ps1 - local HTTP server for e2e Space Invaders.
# Serves the repository root on http://localhost:8080/index.html.
# Run from the repository root. Press Ctrl+C to stop.

$Port = 8080
$Root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Set-Location $Root

Write-Host "[run.ps1] Serving e2e Space Invaders at http://localhost:$Port/index.html"
Write-Host "[run.ps1] Press Ctrl+C to stop."

$python = $null
if (Get-Command python3 -ErrorAction SilentlyContinue) {
    $python = 'python3'
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $python = 'python'
} else {
    Write-Host '[run.ps1] ERROR: Python not found. Open index.html via file:// instead.'
    exit 1
}

# Open browser
Start-Process "http://localhost:$Port/index.html"
& $python -m http.server $Port
