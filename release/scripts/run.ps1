# Runs the built e2e calculator cc jar, building it first if it is missing.
# Use this for the release smoke test, or any time you want to start the calculator locally.
# Requires: a Java 21 runtime, and Maven (mvn) on PATH if the jar has not been built yet.

$ErrorActionPreference = "Stop"
$JarPath = "target/calculator-0.1.0.jar"

if (-not (Test-Path $JarPath)) {
    Write-Host "$JarPath not found, building it first"
    Write-Host "+ mvn -B package"
    mvn -B package
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not (Test-Path $JarPath)) {
    Write-Host "ERROR: build completed but $JarPath still not found"
    exit 1
}

Write-Host "+ java -jar $JarPath"
java -jar $JarPath
