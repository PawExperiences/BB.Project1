# release/scripts/release.ps1
# Purpose: build prime_tester in Release mode, smoke-test it against the task
# acceptance criteria, then tag, push, and publish a GitHub release with the
# binary attached. Run once the CI-currency and release-tree checks have both
# passed, from a clean checkout of the branch being released.
# Usage: powershell -File release/scripts/release.ps1 [-Version 0.6.0]

param(
    [string]$Version = "0.6.0"
)

$ErrorActionPreference = "Stop"

$Tag = "v$Version"
$BuildDir = "build"
$NotesFile = Join-Path "release" (Join-Path "notes" "$Tag.md")

function Fail($msg) {
    Write-Error "ERROR: $msg"
    exit 1
}

Write-Host "== prime_tester release $Tag =="

Write-Host "-- Checking working tree is clean --"
$status = git status --porcelain
if ($status) {
    Fail "working tree has uncommitted changes. Commit or stash first."
}

Write-Host "-- Configuring and building (Release) --"
cmake -B $BuildDir -DCMAKE_BUILD_TYPE=Release
if ($LASTEXITCODE -ne 0) { exit 1 }
cmake --build $BuildDir --config Release
if ($LASTEXITCODE -ne 0) { exit 1 }

$candidates = @(
    (Join-Path $BuildDir "prime_tester.exe"),
    (Join-Path $BuildDir (Join-Path "Release" "prime_tester.exe")),
    (Join-Path $BuildDir "prime_tester"),
    (Join-Path $BuildDir (Join-Path "Release" "prime_tester"))
)
$Binary = $null
foreach ($c in $candidates) {
    if (Test-Path $c -PathType Leaf) { $Binary = $c; break }
}
if (-not $Binary) {
    Fail "built executable not found under $BuildDir"
}
Write-Host "Found executable: $Binary"

Write-Host "-- Smoke test: argv mode --"
$out = (& $Binary 2 3 4 17 18 | Out-String).TrimEnd("`r","`n")
$expected = "2 is prime`n3 is prime`n4 is not prime`n17 is prime`n18 is not prime"
if ($out -ne $expected) {
    Fail "argv-mode smoke test mismatch. Got:`n$out"
}

Write-Host "-- Smoke test: --upto 30 --"
$outUpto = (& $Binary --upto 30 | Out-String).TrimEnd("`r","`n")
$expectedUpto = "2`n3`n5`n7`n11`n13`n17`n19`n23`n29"
if ($outUpto -ne $expectedUpto) {
    Fail "--upto 30 smoke test mismatch."
}

Write-Host "-- Smoke test: empty stdin --"
$outEmpty = ("" | & $Binary | Out-String)
if ($outEmpty.Trim() -ne "") {
    Fail "empty-stdin smoke test produced output, expected none."
}

Write-Host "-- Smoke test: malformed token --"
$errFile = New-TemporaryFile
"abc" | & $Binary 2> $errFile | Out-Null
$badStatus = $LASTEXITCODE
$errBad = (Get-Content $errFile -Raw).Trim()
Remove-Item $errFile -Force
if ($badStatus -ne 1 -or $errBad -ne "not a number: abc") {
    Fail "malformed-token smoke test mismatch (status=$badStatus stderr='$errBad')."
}

Write-Host "All smoke tests passed."

git rev-parse $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists locally; skipping tag creation."
} else {
    Write-Host "-- Creating annotated tag $Tag --"
    git tag -a $Tag -m "Release $Tag"
}

Write-Host "-- Pushing tag $Tag to origin --"
git push origin $Tag

$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCmd) {
    gh release view $Tag *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "GitHub release $Tag already exists; skipping creation."
    } else {
        if (-not (Test-Path $NotesFile -PathType Leaf)) {
            Fail "notes file $NotesFile not found. Write releaseNotes there first."
        }
        Write-Host "-- Creating GitHub release $Tag --"
        gh release create $Tag $Binary --title "prime_tester $Tag" --notes-file $NotesFile
    }
} else {
    Write-Warning "gh CLI not found; skipping GitHub release creation. Install it and re-run, or publish manually with $Binary attached."
}

Write-Host "== Release $Tag complete =="
