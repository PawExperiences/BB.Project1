# run.ps1 - serve the project over HTTP and open index.html in the browser.
# Serves on http://localhost:8080. Press Ctrl+C to stop.

$Port = 8080
$Url = "http://localhost:$Port/index.html"

# Change to repo root (two levels up from release/scripts)
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '../..')
Set-Location $RepoRoot
Write-Host "[run] Serving '$RepoRoot' at $Url"
Write-Host '[run] Press Ctrl+C to stop.'

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

# Open browser
Start-Process $Url

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ($localPath -eq '') { $localPath = 'index.html' }
        $filePath = Join-Path $RepoRoot $localPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.js'   { 'application/javascript; charset=utf-8' }
                '.css'  { 'text/css; charset=utf-8' }
                default { 'application/octet-stream' }
            }
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    Write-Host '[run] Server stopped.'
}
