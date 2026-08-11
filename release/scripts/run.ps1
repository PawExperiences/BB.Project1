# Serve the built static site from dist/ for local review.
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path (Join-Path $ScriptDir "..") "..")
$DistDir = Join-Path $RepoRoot "dist"
$Port = $env:PORT
if (-not $Port) { $Port = "4321" }

if (-not (Test-Path $DistDir)) {
    Write-Host "dist/ not found. Run release/scripts/release.ps1 (or npm ci && npm run build) first."
    exit 1
}

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Start()
Write-Host "Serving $DistDir at http://localhost:$Port/"

$MimeTypes = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".ico"  = "image/x-icon"
    ".txt"  = "text/plain"
}

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $RelPath = $Request.Url.AbsolutePath.TrimStart("/")
        if ([string]::IsNullOrEmpty($RelPath)) { $RelPath = "index.html" }
        $FilePath = Join-Path $DistDir $RelPath

        if ((Test-Path $FilePath) -and (Get-Item $FilePath).PSIsContainer) {
            $FilePath = Join-Path $FilePath "index.html"
        }

        if (Test-Path $FilePath) {
            $Ext = [System.IO.Path]::GetExtension($FilePath)
            $ContentType = $MimeTypes[$Ext]
            if (-not $ContentType) { $ContentType = "application/octet-stream" }
            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Response.StatusCode = 404
            $NotFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $Response.OutputStream.Write($NotFoundBytes, 0, $NotFoundBytes.Length)
        }
        $Response.OutputStream.Close()
    }
} finally {
    $Listener.Stop()
}
