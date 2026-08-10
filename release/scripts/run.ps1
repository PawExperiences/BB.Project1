$ErrorActionPreference = "Stop"

if ($env:ARTIFACT) { $Artifact = $env:ARTIFACT } else { $Artifact = "target/calculator-0.1.0.jar" }

Write-Host "== run.ps1: launching e2e calculator =="
if (-not (Test-Path $Artifact)) {
    Write-Host "-> $Artifact not found, building it first (mvn -B package)"
    mvn -B package
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not (Test-Path $Artifact)) {
    Write-Error "ERROR: build did not produce $Artifact"
    exit 1
}

Write-Host "-> starting: java -jar $Artifact"
java -jar $Artifact
