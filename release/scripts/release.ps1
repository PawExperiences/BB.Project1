# release.ps1 -- release e2e prime tester 0.3.0 (ASCII PowerShell).
#
# Automated release steps, in order:
#   1. clean CMake configure + build (cmake -B build; cmake --build build)
#   2. run the CTest suite (ctest --output-on-failure, from build/)
#   3. smoke-test the CLI (argv mode, stdin mode, --upto 30, bad-token exit 1)
#   4. package the binary as prime_tester-<version>-<os>-<arch>.zip
#   5. create and push annotated git tag v0.3.0
#   6. create the GitHub release via gh and upload the package
#
# Run once, when the release is approved:
#   powershell -File release/scripts/release.ps1
# Idempotent: an existing tag / release / asset is skipped, so re-running
# after a failure is safe. If gh is missing, the tag is still pushed and
# the exact manual gh command is printed.
$ErrorActionPreference = "Stop"

$Version = if ($env:VERSION) { $env:VERSION } else { "0.3.0" }
$Tag = if ($env:TAG) { $env:TAG } else { "v$Version" }
$Title = "e2e prime tester $Version"

function Say($Message) { Write-Host "[release] $Message" }

Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Say "step 1/6: clean build"
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
cmake -B build
if ($LASTEXITCODE -ne 0) { throw "cmake configure failed (exit $LASTEXITCODE)" }
cmake --build build
if ($LASTEXITCODE -ne 0) { throw "cmake build failed (exit $LASTEXITCODE)" }

Say "step 2/6: ctest"
Push-Location "build"
try {
  ctest --output-on-failure
  $ctestRc = $LASTEXITCODE
} finally {
  Pop-Location
}
if ($ctestRc -ne 0) { throw "ctest failed (exit $ctestRc)" }

Say "step 3/6: CLI smoke tests"
$Exe = $null
foreach ($candidate in @(
    "build/prime_tester.exe", "build/prime_tester",
    "build/Debug/prime_tester.exe", "build/Release/prime_tester.exe",
    "build/Debug/prime_tester", "build/Release/prime_tester")) {
  if (Test-Path $candidate) { $Exe = $candidate; break }
}
if (-not $Exe) { throw "prime_tester binary not found under build/" }

$out = & $Exe 2 4 17
if ($LASTEXITCODE -ne 0 -or ($out -join "`n") -ne "2 is prime`n4 is not prime`n17 is prime") {
  throw "smoke: argv mode failed: $($out -join ' | ')"
}
$out = & $Exe --upto 30
if ($LASTEXITCODE -ne 0 -or ($out -join "`n") -ne "2`n3`n5`n7`n11`n13`n17`n19`n23`n29") {
  throw "smoke: --upto 30 failed: $($out -join ' | ')"
}
$out = @("2", "4", "17") | & $Exe
if ($LASTEXITCODE -ne 0 -or ($out -join "`n") -ne "2 is prime`n4 is not prime`n17 is prime") {
  throw "smoke: stdin mode failed: $($out -join ' | ')"
}
$badOut = & $Exe abc 2>&1 | Out-String
$badRc = $LASTEXITCODE
if ($badRc -ne 1 -or $badOut -notlike "*not a number: abc*") {
  throw "smoke: bad-token contract failed (rc=$badRc, output=$badOut)"
}
Say "smoke tests passed"

Say "step 4/6: package binary"
if ($IsWindows -or $env:OS -eq "Windows_NT") { $osName = "windows" }
elseif ($IsMacOS) { $osName = "macos" }
else { $osName = "linux" }
$arch = "unknown"
if ($env:PROCESSOR_ARCHITECTURE) { $arch = $env:PROCESSOR_ARCHITECTURE.ToLower() }
elseif (Get-Command uname -ErrorAction SilentlyContinue) { $arch = (uname -m).ToLower() }
$Archive = "prime_tester-$Version-$osName-$arch.zip"
if (Test-Path $Archive) { Remove-Item -Force $Archive }
Compress-Archive -Path $Exe -DestinationPath $Archive
Say "wrote $Archive"

Say "step 5/6: git tag $Tag"
git rev-parse -q --verify "refs/tags/$Tag" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Say "local tag $Tag already exists; skipping creation"
} else {
  git tag -a $Tag -m $Title
  if ($LASTEXITCODE -ne 0) { throw "git tag failed (exit $LASTEXITCODE)" }
}
$remoteTags = git ls-remote --tags origin "refs/tags/$Tag"
if ($remoteTags -match [regex]::Escape("refs/tags/$Tag")) {
  Say "remote tag $Tag already exists; skipping push"
} else {
  git push origin $Tag
  if ($LASTEXITCODE -ne 0) { throw "git push failed (exit $LASTEXITCODE)" }
}

Say "step 6/6: GitHub release"
$NotesFile = "build/release-notes.md"
$Notes = @"
e2e prime tester 0.3.0

First release of the Prime Number Tester: a dependency-free C++17
command-line program, built with CMake (>= 3.16).

Highlights
- Single-number primality: "prime_tester 2 4 17" prints one verdict per
  line ("2 is prime", "4 is not prime", "17 is prime").
- Bulk generation: "prime_tester --upto N" lists every prime up to N, one
  per line, via a Sieve of Eratosthenes (N = 10000000 finishes in seconds).
- Forgiving input: non-numeric or out-of-range tokens are echoed verbatim
  to stderr as "not a number: <token>"; processing continues and the exit
  status is 1 if any bad token occurred, 0 on a clean run.
- Two-command build: cmake -B build && cmake --build build. The README's
  worked-examples table gives eight copy-pasteable commands with the exact
  expected output and exit status for manual verification.

Verify the build: cd build && ctest --output-on-failure
"@
Set-Content -Path $NotesFile -Value $Notes -Encoding Ascii

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Say "gh CLI not found; skipping GitHub release creation."
  Say "tag $Tag is pushed; publish manually with:"
  Say "  gh release create $Tag --title `"$Title`" --notes-file $NotesFile $Archive"
  exit 0
}
gh release view $Tag 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  Say "release $Tag already exists; skipping creation"
} else {
  gh release create $Tag --title $Title --notes-file $NotesFile
  if ($LASTEXITCODE -ne 0) { throw "gh release create failed (exit $LASTEXITCODE)" }
}
$assets = gh release view $Tag --json assets --jq ".assets[].name"
if (@($assets) -contains $Archive) {
  Say "asset $Archive already uploaded; skipping"
} else {
  gh release upload $Tag $Archive
  if ($LASTEXITCODE -ne 0) { throw "gh release upload failed (exit $LASTEXITCODE)" }
}
Say "done: release $Tag published"
