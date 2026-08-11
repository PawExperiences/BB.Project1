$ErrorActionPreference = "Stop"

$BinaryName = "wordcount"
$CandidateExe = Join-Path "." ($BinaryName + ".exe")
$CandidatePlain = Join-Path "." $BinaryName

if (Test-Path $CandidateExe) {
    $BinaryPath = $CandidateExe
} elseif (Test-Path $CandidatePlain) {
    $BinaryPath = $CandidatePlain
} else {
    $BinaryPath = $CandidateExe
}

if (-not (Test-Path $BinaryPath)) {
    Write-Host "-- Binary not found, building $BinaryName"
    & go build -o $BinaryPath .
    if ($LASTEXITCODE -ne 0) { throw "go build failed" }
} else {
    Write-Host "-- Using existing $BinaryPath binary"
}

Write-Host "-- Running $BinaryPath $args"
& $BinaryPath @args
exit $LASTEXITCODE
