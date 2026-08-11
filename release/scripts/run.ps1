# Serve the built e2e quote page (dist/) locally for a smoke check.
# Run this after `npm run build` (or release/scripts/release.ps1) to
# view the shipped static site at http://127.0.0.1:4173 (or $env:PORT).

$ErrorActionPreference = "Stop"

$RepoRoot = (git rev-parse --show-toplevel).Trim()
$DistDir = Join-Path $RepoRoot "dist"
$Port = 4173
if ($env:PORT) { $Port = [int]$env:PORT }

$IndexPath = Join-Path $DistDir "index.html"
if (-not (Test-Path $IndexPath)) {
    Write-Host "ERROR: $IndexPath not found. Run 'npm ci; npm run build' first."
    exit 1
}

$Prefix = "http://127.0.0.1:$Port/"
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add($Prefix)
$Listener.Start()
Write-Host "Serving $DistDir at $Prefix (Ctrl+C to stop)"

$MimeTypes = @{
    ".html" = "text/html"
    ".css" = "text/css"
    ".js" = "application/javascript"
    ".json" = "application/json"
    ".svg" = "image/svg+xml"
    ".png" = "image/png"
    ".ico" = "image/x-icon"
    ".txt" = "text/plain"
}

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $LocalPath = $Context.Request.Url.LocalPath
        if ($LocalPath -eq "/") { $LocalPath = "/index.html" }
        $FilePath = Join-Path $DistDir ($LocalPath.TrimStart("/"))
        if (Test-Path $FilePath -PathType Leaf) {
            $Ext = [System.IO.Path]::GetExtension($FilePath)
            $ContentType = $MimeTypes[$Ext]
            if (-not $ContentType) { $ContentType = "application/octet-stream" }
            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            $Context.Response.ContentType = $ContentType
            $Context.Response.ContentLength64 = $Bytes.Length
            $Context.Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Context.Response.StatusCode = 404
        }
        $Context.Response.OutputStream.Close()
    }
} finally {
    $Listener.Stop()
}
