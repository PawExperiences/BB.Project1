# run.ps1 - serves the game over localhost:8080.
# Use when the browser blocks ES module imports from file:// URLs.
# The game also opens directly from disk (no server) in most browsers.

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir '../..')

$Port = 8080
$Prefix = "http://127.0.0.1:$Port/"

Write-Host "Serving e2e Space Invaders at ${Prefix}index.html"
Write-Host "Press Ctrl+C to stop."

$Listener = [System.Net.HttpListener]::new()
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

try {
    while ($Listener.IsListening) {
        $Context   = $Listener.GetContext()
        $LocalPath = $Context.Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($LocalPath)) { $LocalPath = 'index.html' }
        $FilePath  = Join-Path (Get-Location) $LocalPath
        if (Test-Path $FilePath -PathType Leaf) {
            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            $Context.Response.ContentLength64 = $Bytes.Length
            $Context.Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Context.Response.StatusCode = 404
        }
        $Context.Response.OutputStream.Close()
    }
} finally {
    $Listener.Stop()
    Write-Host 'Server stopped.'
}
