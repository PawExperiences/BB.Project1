# run.ps1 -- Starts the e2e calculator application by invoking the built JAR.
# Requires: JDK 21 on PATH, target/calculator-0.1.0.jar present (run mvn -B package first).
# Run after a successful build to smoke-test or use the calculator.

$ErrorActionPreference = 'Stop'

$JAR = Join-Path 'target' 'calculator-0.1.0.jar'

if (-not (Test-Path $JAR)) {
    Write-Error "ERROR: $JAR not found. Run 'mvn -B package' first."
    exit 1
}

Write-Host "Launching: java -jar $JAR"
$proc = Start-Process -FilePath 'java' -ArgumentList '-jar', $JAR -NoNewWindow -PassThru -Wait
exit $proc.ExitCode
