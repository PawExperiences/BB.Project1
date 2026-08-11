# Build (if needed) and run the wordcount CLI, forwarding all arguments.
# Use this to try the tool locally: run without args to read from stdin,
# or pass one or more file paths to count lines/words/bytes in each.

$Module = 'wordcount'
$BinDir = 'bin'
$Binary = Join-Path $BinDir "$Module.exe"

if (-not (Get-Command 'go' -ErrorAction SilentlyContinue)) {
    Write-Error 'error: go toolchain not found on PATH'
    exit 1
}

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
Write-Host "+ go build -o $Binary ."
& go build -o $Binary .
if ($LASTEXITCODE -ne 0) {
    Write-Error "error: go build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "+ $Binary $args"
& $Binary @args
exit $LASTEXITCODE
