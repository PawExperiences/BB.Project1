# run.ps1 - Serves the Space Invaders game on http://localhost:8080.
# NOTE: The game is also fully playable by opening index.html directly
# from the filesystem (file:// URL) - no server is required.
$ErrorActionPreference = 'Stop'

$PORT = 8080
$ROOT = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path

Write-Host "[run] Serving '$ROOT' at http://localhost:$PORT"
Write-Host "[run] Open http://localhost:$PORT/index.html in your browser."
Write-Host '[run] Press Ctrl+C to stop.'

Set-Location $ROOT

$python = $null
foreach ($candidate in @('python3', 'python')) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) {
        $python = $candidate
        break
    }
}

if ($python) {
    & $python -m http.server $PORT
} else {
    Write-Host '[run] ERROR: python3 or python not found. Install Python 3 and retry.' -ForegroundColor Red
    exit 1
}
