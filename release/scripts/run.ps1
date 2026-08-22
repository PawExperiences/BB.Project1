# run.ps1 - serve the Space Invaders game locally and open it in a browser.
#
# WHAT IT DOES
#   Starts a read-only static file server (Python's standard-library
#   http.server) rooted at the repository root and opens
#   http://localhost:<port>/index.html.  Serving over http:// is what makes the
#   ES module imports work: Chrome and Edge refuse <script type="module">
#   imports from a file:// origin because the origin is null.
#
# WHEN TO RUN IT
#   Whenever you want to play or smoke-test the game: the manual verification
#   step of the release runbook, or after unzipping the release artifact.
#   Ctrl-C stops the server.
#
# It writes nothing and serves only.  Idempotent: if something already answers
# on the port it reports that and exits instead of starting a second server.
#
# Windows PowerShell 5.1 compatible (no PS7-only syntax).

param(
    [int]$Port = 8080,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Continue"

function Say([string]$Message) {
    Write-Host "[run] $Message"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $scriptDir "..\..")).Path

if (-not (Test-Path (Join-Path $root "index.html"))) {
    Say "index.html was not found in $root"
    Say "run this from the repository checkout (release\scripts\run.ps1)"
    exit 1
}

$python = $null
foreach ($candidate in @("python3", "python")) {
    $found = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($found) {
        $python = $found.Source
        break
    }
}

$url = "http://localhost:$Port/index.html"

$busy = $false
try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if ($async.AsyncWaitHandle.WaitOne(500)) {
        $client.EndConnect($async)
        $busy = $true
    }
    $client.Close()
} catch {
    $busy = $false
}

if ($busy) {
    Say "port $Port is already serving - not starting a second server"
    Say "open $url"
    exit 0
}

if (-not $python) {
    Say "no python interpreter found - cannot start a local server."
    Say "install Python 3, or open $root\index.html directly (browsers may refuse"
    Say "ES module imports from file:// origins)."
    exit 1
}

Say "serving $root at $url"
Say "controls: ENTER starts and restarts, Left/Right or A/D move, Space fires"
Say "press Ctrl-C here to stop the server"

if (-not $NoBrowser) {
    Start-Job -ScriptBlock { param($u) Start-Sleep -Seconds 1; Start-Process $u } -ArgumentList $url | Out-Null
}

Set-Location $root
& $python -m http.server $Port --bind 127.0.0.1
