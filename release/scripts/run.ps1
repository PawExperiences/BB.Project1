# Launch the calculator desktop app.
# Locates target/calculator-*.jar (running mvn -B package first if missing)
# and starts it with java -jar. Requires a Java 21 runtime and a graphical
# display. Run from the repository root.
# Usage: powershell -File release/scripts/run.ps1
$ErrorActionPreference = 'Stop'

function Find-CalculatorJar {
    $jars = @(Get-ChildItem -Path 'target' -Filter 'calculator-*.jar' -ErrorAction SilentlyContinue |
              Where-Object { $_.Name -notlike '*-sources.jar' -and $_.Name -notlike '*-javadoc.jar' })
    if ($jars.Count -eq 1) { return $jars[0].FullName }
    return $null
}

$jar = Find-CalculatorJar
if (-not $jar) {
    Write-Host 'No built JAR found; running: mvn -B package (full test suite)'
    mvn -B package
    if ($LASTEXITCODE -ne 0) { throw "mvn package failed with exit code $LASTEXITCODE" }
    $jar = Find-CalculatorJar
}
if (-not $jar) { throw 'No target/calculator-*.jar available after build.' }
Write-Host "Launching: java -jar $jar"
java -jar $jar
exit $LASTEXITCODE
