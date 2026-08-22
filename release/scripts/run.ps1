#Requires -Version 5.1
<#
run.ps1 -- build (if needed) and run the prime_tester console app.

WHAT IT DOES: locates prime_tester under the build directory (including the
Release and Debug config subdirectories that multi-config generators use),
configures and builds it with CMake if it is missing (unless -NoBuild), then
runs it with every remaining argument passed straight through and exits with the
app's own exit code.

WHEN TO RUN: any time you want to exercise the app on Windows -- a smoke check
of a fresh clone or of an unpacked release artefact.

    powershell -File release\scripts\run.ps1 7 8 1 -3 2
    powershell -File release\scripts\run.ps1 --upto 30

Script options must come first and are consumed before the app's arguments:
    -NoBuild / --no-build     fail instead of building when the exe is missing
    -BuildDir DIR / --build-dir DIR   cmake build directory (default build)
    --                        stop option parsing; the rest goes to the app

Windows PowerShell 5.1 compatible, ASCII only. There is deliberately no param()
block so that app arguments such as --upto and -3 reach the app verbatim instead
of being parsed as PowerShell parameters. Idempotent: an existing build is
reused. Progress messages go to stderr so the app's stdout stays pipeable.
#>

$ErrorActionPreference = "Stop"
$ExeName = "prime_tester"

function Note([string]$Message) {
    [Console]::Error.WriteLine($Message)
}

function Fail([string]$Message) {
    [Console]::Error.WriteLine("error: " + $Message)
    exit 1
}

$buildDir = $env:BUILD_DIR
if ([string]::IsNullOrEmpty($buildDir)) { $buildDir = "build" }
$noBuild = $false

$rest = @()
if ($null -ne $args) { $rest = @($args) }

while ($rest.Count -gt 0) {
    $head = [string]$rest[0]
    if ($head -eq "-NoBuild" -or $head -eq "--no-build") {
        $noBuild = $true
        if ($rest.Count -gt 1) { $rest = @($rest[1..($rest.Count - 1)]) } else { $rest = @() }
    } elseif ($head -eq "-BuildDir" -or $head -eq "--build-dir") {
        if ($rest.Count -lt 2) { Fail "-BuildDir needs a value" }
        $buildDir = [string]$rest[1]
        if ($rest.Count -gt 2) { $rest = @($rest[2..($rest.Count - 1)]) } else { $rest = @() }
    } elseif ($head -eq "--") {
        if ($rest.Count -gt 1) { $rest = @($rest[1..($rest.Count - 1)]) } else { $rest = @() }
        break
    } else {
        break
    }
}

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $root
Note ("==> repository: " + $root)

function Find-Exe([string]$Dir) {
    $candidates = @(
        (Join-Path $Dir ($ExeName + ".exe")),
        (Join-Path (Join-Path $Dir "Release") ($ExeName + ".exe")),
        (Join-Path (Join-Path $Dir "Debug") ($ExeName + ".exe")),
        (Join-Path $Dir $ExeName)
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    return ""
}

$exe = Find-Exe $buildDir

if ([string]::IsNullOrEmpty($exe)) {
    if ($noBuild) {
        Fail ($ExeName + " not found under " + $buildDir + " and -NoBuild was given")
    }
    Note ("==> " + $ExeName + " not found under " + $buildDir + "; building it now")
    Note ("    + cmake -B " + $buildDir + " -DCMAKE_BUILD_TYPE=Release")
    & cmake -B $buildDir -DCMAKE_BUILD_TYPE=Release
    if ($LASTEXITCODE -ne 0) { Fail "cmake configure failed" }
    Note ("    + cmake --build " + $buildDir + " --config Release")
    & cmake --build $buildDir --config Release
    if ($LASTEXITCODE -ne 0) { Fail "cmake build failed" }
    $exe = Find-Exe $buildDir
    if ([string]::IsNullOrEmpty($exe)) {
        Fail ("build finished but " + $ExeName + " is still not under " + $buildDir)
    }
} else {
    Note "==> reusing existing build"
}

Note ("==> running: " + $exe + " " + ($rest -join " "))
if ($rest.Count -gt 0) {
    & $exe @rest
} else {
    & $exe
}
exit $LASTEXITCODE
