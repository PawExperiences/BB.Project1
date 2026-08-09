# run.ps1 — Serves the Space Invaders game on http://localhost:8080 and opens it in the browser.
# Use when you want to test via http://. The game also works directly from file://.

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '../..')
$Port = 8080
$Url = "http://localhost:$Port/index.html"

Set-Location $RepoRoot
Write-Host "Serving e2e space invaders from $RepoRoot"
Write-Host "Opening $Url ..."
Write-Host 'Press Ctrl+C to stop.'

$Timer = [System.Timers.Timer]::new(1000)
$Timer.AutoReset = $false
Register-ObjectEvent -InputObject $Timer -EventName Elapsed -Action {
    Start-Process $Url
} | Out-Null
$Timer.Start()

try {
    python3 -m http.server $Port
} catch {
    python -m http.server $Port
}
