# run.ps1 -- serves the game locally on http://localhost:8080 and opens it.
# Run from the repository root. Ctrl-C to stop. Requires Python 3 on PATH.

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '../..')
$Port     = 8080
$Url      = "http://localhost:$Port/index.html"

Set-Location $RepoRoot
Write-Host "Serving on $Url  (Ctrl-C to stop)"

$server = Start-Process -FilePath 'python3' `
    -ArgumentList "-m http.server $Port" `
    -WorkingDirectory $RepoRoot `
    -PassThru -NoNewWindow

Start-Sleep -Seconds 1
Start-Process $Url

try {
    $server.WaitForExit()
} finally {
    if (-not $server.HasExited) { $server.Kill() }
    Write-Host 'Stopped.'
}
