# Builds (if needed) and runs the wordcount CLI, forwarding all arguments to
# it. With no file arguments the CLI reads stdin, matching normal wc-like usage.
# Usage: powershell -File release\scripts\run.ps1 [file ...]
$ErrorActionPreference = "Stop"

if ($env:OUT_PATH) { $OutPath = $env:OUT_PATH } else { $OutPath = "dist\wordcount.exe" }

$outDir = Split-Path -Parent $OutPath
if ($outDir -and -not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

Write-Output "==> Building $OutPath"
go build -o $OutPath ./...
if ($LASTEXITCODE -ne 0) { throw "go build failed" }

Write-Output "==> Running $OutPath $args"
& $OutPath @args
exit $LASTEXITCODE
