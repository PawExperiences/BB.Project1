# release.ps1 - build, smoke-test, tag, and publish the prime_tester v0.6.0 release.
$ErrorActionPreference = "Stop"

$Version = $env:VERSION
if (-not $Version) { $Version = "0.6.0" }
$Tag = "v$Version"
$BuildDir = $env:BUILD_DIR
if (-not $BuildDir) { $BuildDir = "build" }
$Remote = $env:REMOTE
if (-not $Remote) { $Remote = "origin" }
$NotesFile = $env:NOTES_FILE
if (-not $NotesFile) { $NotesFile = Join-Path "release" "RELEASE_NOTES.md" }

Write-Host "==> Configuring: cmake -B $BuildDir"
cmake -B $BuildDir
if ($LASTEXITCODE -ne 0) { throw "cmake configure failed" }

Write-Host "==> Building: cmake --build $BuildDir"
cmake --build $BuildDir
if ($LASTEXITCODE -ne 0) { throw "cmake build failed" }

Write-Host "==> Running CTest suite (unit checks + informational sieve benchmark)"
Push-Location $BuildDir
try {
    ctest --output-on-failure
    if ($LASTEXITCODE -ne 0) { throw "ctest failed" }
} finally {
    Pop-Location
}

$Artifact = Join-Path $BuildDir "prime_tester.exe"
if (-not (Test-Path $Artifact)) { $Artifact = Join-Path $BuildDir "prime_tester" }
if (-not (Test-Path $Artifact)) {
    Write-Error "Expected artifact not found: $Artifact"
    exit 1
}
Write-Host "==> Artifact ready: $Artifact"

Write-Host "==> Smoke-testing artifact against the README Manual Verification scenarios"

function Invoke-Artifact {
    param([string[]]$ArtifactArgs, [string]$StdinText = $null)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Artifact
    $psi.Arguments = ($ArtifactArgs -join ' ')
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardInput = $true
    $psi.UseShellExecute = $false
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi
    [void]$p.Start()
    if ($StdinText -ne $null) { $p.StandardInput.Write($StdinText) }
    $p.StandardInput.Close()
    $stdout = ($p.StandardOutput.ReadToEnd()) -replace "`r`n", "`n"
    $stderr = ($p.StandardError.ReadToEnd()) -replace "`r`n", "`n"
    $p.WaitForExit()
    return @{ ExitCode = $p.ExitCode; Stdout = $stdout.Trim("`n"); Stderr = $stderr.Trim("`n") }
}

function Expect-Out {
    param([string]$Desc, [int]$ExpectedExit, [string]$ExpectedStdout, [string[]]$ArtifactArgs, [string]$StdinText = $null)
    $r = Invoke-Artifact -ArtifactArgs $ArtifactArgs -StdinText $StdinText
    if ($r.ExitCode -ne $ExpectedExit -or $r.Stdout -ne $ExpectedStdout) {
        Write-Error "SMOKE TEST FAILED: $Desc (exit $($r.ExitCode), stdout '$($r.Stdout)')"
        exit 1
    }
    Write-Host "  OK: $Desc"
}

Expect-Out "prime input (17)" 0 "17 is prime" @("17")
Expect-Out "composite input (18)" 0 "18 is not prime" @("18")
Expect-Out "zero input (0)" 0 "0 is not prime" @("0")
Expect-Out "one input (1)" 0 "1 is not prime" @("1")
Expect-Out "negative input (-7)" 0 "-7 is not prime" @("-7")
Expect-Out "empty stdin" 0 "" @() ""

$r = Invoke-Artifact -ArtifactArgs @("abc")
if ($r.ExitCode -ne 1 -or $r.Stderr -ne "not a number: abc") {
    Write-Error "SMOKE TEST FAILED: non-numeric token 'abc' should print 'not a number: abc' to stderr and exit 1"
    exit 1
}
Write-Host "  OK: non-numeric token 'abc' -> stderr 'not a number: abc', exit 1"

$expectedUpto = "2`n3`n5`n7`n11`n13`n17`n19`n23`n29"
Expect-Out "--upto 30" 0 $expectedUpto @("--upto", "30")

Write-Host "==> All smoke tests passed"

git rev-parse $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> Tag $Tag already exists locally, skipping tag creation"
} else {
    Write-Host "==> Creating annotated tag $Tag"
    git tag -a $Tag -m "Release $Tag"
}

Write-Host "==> Pushing tag $Tag to $Remote"
git push $Remote $Tag
if ($LASTEXITCODE -ne 0) { throw "git push tag failed" }

$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghCmd) {
    Write-Warning "'gh' CLI not found; skipping GitHub release creation/upload."
    Write-Warning "Publish manually and attach: $Artifact"
} else {
    gh release view $Tag *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "==> GitHub release $Tag already exists, skipping creation"
    } else {
        Write-Host "==> Creating GitHub release $Tag and uploading artifact"
        if (Test-Path $NotesFile) {
            gh release create $Tag $Artifact --title $Tag --notes-file $NotesFile
        } else {
            gh release create $Tag $Artifact --title $Tag --notes "Release $Tag"
        }
        if ($LASTEXITCODE -ne 0) { throw "gh release create failed" }
    }
}

Write-Host "==> Done. Release $Tag built, smoke-tested, and published (or ready for manual publish)."
