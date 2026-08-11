# Purpose: build (if needed) and run the wordcount binary, forwarding all args/stdin.
# Usage: release/scripts/run.ps1 [file...]   (no args reads stdin, per the tool's own CLI rules)
$Bin = "wordcount.exe"

$NeedBuild = $true
if (Test-Path $Bin) {
    $BinTime = (Get-Item $Bin).LastWriteTime
    $NeedBuild = $false
    foreach ($src in @("main.go", "count.go")) {
        if (Test-Path $src) {
            $SrcTime = (Get-Item $src).LastWriteTime
            if ($SrcTime -gt $BinTime) {
                $NeedBuild = $true
            }
        }
    }
}

if ($NeedBuild) {
    Write-Host "==> Building wordcount"
    & go build -o $Bin .
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ("==> Running: " + $Bin + " " + ($args -join " "))
& ".\$Bin" @args
exit $LASTEXITCODE
