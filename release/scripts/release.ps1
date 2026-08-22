#Requires -Version 5.1
<#
release.ps1 -- run the automated release steps for prime_tester.

WHAT IT DOES: refuses a dirty working tree; checks whether the release tag
already exists locally or on the remote and never moves or deletes one that
does; builds prime_tester with CMake in Release mode; runs the CTest suite and
two CLI smoke checks; packages the executable into
dist\prime_tester-<version>-Windows-<arch>.zip; creates and pushes the annotated
tag; creates the GitHub release with that asset attached.

WHEN TO RUN: from a clean checkout of main, after the release-notes PR is merged
and the BuildBoard build of main is green. Run it with -DryRun first.

Windows PowerShell 5.1 compatible, ASCII only. Idempotent: re-running after a
partial release skips what is already done. It never force-pushes and never
deletes a tag, a release or an asset.
#>

param(
    [string]$Version   = "0.6.0",
    [string]$Tag       = "",
    [string]$Remote    = "origin",
    [string]$BuildDir  = "build",
    [string]$DistDir   = "dist",
    [string]$NotesFile = "docs/releases/0-6-0.md",
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [switch]$NoPublish,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ExeName = "prime_tester"

function Say([string]$Message) {
    Write-Host $Message
}

function Fail([string]$Message) {
    Write-Host ("error: " + $Message)
    exit 1
}

function Invoke-Step([string]$File, [string[]]$Arguments) {
    Say ("  + " + $File + " " + ($Arguments -join " "))
    if ($DryRun) { return }
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) {
        Fail ($File + " failed with exit code " + $LASTEXITCODE)
    }
}

function Get-CmdOutput([string]$File, [string[]]$Arguments) {
    $output = & $File @Arguments 2>$null
    $script:LastCode = $LASTEXITCODE
    if ($null -eq $output) { return "" }
    return ((($output) -join "`n").Trim())
}

if ([string]::IsNullOrEmpty($Tag)) { $Tag = "v" + $Version }

$root = Get-CmdOutput "git" @("rev-parse", "--show-toplevel")
if ($script:LastCode -ne 0 -or [string]::IsNullOrEmpty($root)) {
    Fail "not inside a git repository"
}
Set-Location -LiteralPath $root

Say "==> prime_tester release"
Say ("    repository : " + $root)
Say ("    version    : " + $Version)
Say ("    tag        : " + $Tag)
Say ("    remote     : " + $Remote)
if ($DryRun) { Say "    mode       : DRY RUN (nothing will change)" }

Say "==> checking the working tree is clean"
$dirty = Get-CmdOutput "git" @("status", "--porcelain")
if (-not [string]::IsNullOrEmpty($dirty)) {
    if ($DryRun) {
        Say "    !! working tree is dirty (tolerated because of -DryRun)"
    } else {
        Fail "working tree is dirty; commit or stash before releasing"
    }
} else {
    Say "    clean"
}

$headSha = Get-CmdOutput "git" @("rev-parse", "HEAD")
Say ("    release commit: " + $headSha)

Say ("==> preflight: does " + $Tag + " already exist?")
$localTag = Get-CmdOutput "git" @("rev-parse", "-q", "--verify", ("refs/tags/" + $Tag))
$hasLocal = ($script:LastCode -eq 0 -and -not [string]::IsNullOrEmpty($localTag))
$remoteLine = Get-CmdOutput "git" @("ls-remote", "--tags", $Remote, ("refs/tags/" + $Tag))
$hasRemote = (-not [string]::IsNullOrEmpty($remoteLine))
$tagCommit = ""
if ($hasLocal) {
    $tagCommit = Get-CmdOutput "git" @("rev-list", "-n", "1", $Tag)
}

if ($hasLocal -and ($tagCommit -ne $headSha)) {
    Fail ("local tag " + $Tag + " points at " + $tagCommit + ", not HEAD (" + $headSha + "). This script never moves a tag.")
}
if ($hasRemote -and ($tagCommit -ne $headSha)) {
    Fail ($Tag + " already exists on " + $Remote + " (published by an earlier run). Moving or deleting a published tag is forbidden -- ask a human to confirm it or bump the version (-Version 0.6.1).")
}
if ($hasRemote) {
    Say ("    " + $Tag + " already on " + $Remote + " and points at HEAD; nothing to create")
} elseif ($hasLocal) {
    Say ("    " + $Tag + " exists locally at HEAD but is not pushed yet")
} else {
    Say ("    not found locally or on " + $Remote + " -- good")
}

if ($SkipBuild) {
    Say "==> build: skipped (-SkipBuild)"
} else {
    Say "==> build: cmake configure + build (Release)"
    Invoke-Step "cmake" @("-B", $BuildDir, "-DCMAKE_BUILD_TYPE=Release")
    Invoke-Step "cmake" @("--build", $BuildDir, "--config", "Release")
}

$candidates = @(
    (Join-Path $BuildDir ($ExeName + ".exe")),
    (Join-Path (Join-Path $BuildDir "Release") ($ExeName + ".exe")),
    (Join-Path (Join-Path $BuildDir "Debug") ($ExeName + ".exe")),
    (Join-Path $BuildDir $ExeName)
)
$exe = ""
foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { $exe = $candidate; break }
}
if ([string]::IsNullOrEmpty($exe)) {
    if ($DryRun) {
        $exe = Join-Path $BuildDir ($ExeName + ".exe")
        Say ("==> executable: " + $exe + " (assumed; dry run)")
    } else {
        Fail ("executable " + $ExeName + " not found under " + $BuildDir)
    }
} else {
    Say ("==> executable: " + $exe)
}

if ($SkipTests) {
    Say "==> tests: skipped (-SkipTests)"
} else {
    Say "==> tests: ctest"
    Invoke-Step "ctest" @("--test-dir", $BuildDir, "--output-on-failure")
    if (-not $DryRun) {
        Say "==> smoke: --upto 10 must print 2 3 5 7 and exit 0"
        $out = & $exe --upto 10
        $code = $LASTEXITCODE
        $got = (($out | ForEach-Object { $_.Trim() }) -join ",")
        if ($code -ne 0 -or $got -ne "2,3,5,7") {
            Fail ("smoke failed: '--upto 10' exited " + $code + " and printed [" + $got + "]")
        }
        Say "==> smoke: a bad token must exit 1 without aborting the run"
        & $exe 5 abc 6 1>$null 2>$null
        if ($LASTEXITCODE -ne 1) {
            Fail ("smoke failed: '5 abc 6' exited " + $LASTEXITCODE + ", expected 1")
        }
        Say "    smoke checks passed"
    }
}

$arch = $env:PROCESSOR_ARCHITECTURE
if ([string]::IsNullOrEmpty($arch)) { $arch = "unknown" }
$assetName = $ExeName + "-" + $Version + "-Windows-" + $arch + ".zip"
$asset = Join-Path $DistDir $assetName
Say ("==> package: " + $asset)
if ($DryRun) {
    Say ("  + Compress-Archive " + $exe + " -> " + $asset)
} else {
    if (-not (Test-Path -LiteralPath $DistDir)) {
        New-Item -ItemType Directory -Path $DistDir | Out-Null
    }
    $stage = Join-Path $DistDir ("stage-" + $Version)
    if (Test-Path -LiteralPath $stage) {
        Remove-Item -LiteralPath $stage -Recurse -Force -Confirm:$false
    }
    New-Item -ItemType Directory -Path $stage | Out-Null
    Copy-Item -LiteralPath $exe -Destination $stage
    foreach ($extra in @("README.md", "CHANGELOG.md", "LICENSE")) {
        if (Test-Path -LiteralPath $extra -PathType Leaf) {
            Copy-Item -LiteralPath $extra -Destination $stage
        }
    }
    if (Test-Path -LiteralPath $asset) {
        Remove-Item -LiteralPath $asset -Force -Confirm:$false
    }
    Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $asset
    Remove-Item -LiteralPath $stage -Recurse -Force -Confirm:$false
    Say ("    wrote " + $asset)
}

if ($hasLocal) {
    Say ("==> tag: " + $Tag + " already exists locally at HEAD; not re-creating")
} else {
    Say ("==> tag: creating annotated tag " + $Tag)
    Invoke-Step "git" @("tag", "-a", $Tag, "-m", ($ExeName + " " + $Version))
}

if ($hasRemote) {
    Say ("==> push: " + $Tag + " already on " + $Remote + "; skipping")
} else {
    Say ("==> push: " + $Tag + " -> " + $Remote + " (no force, ever)")
    Invoke-Step "git" @("push", $Remote, ("refs/tags/" + $Tag))
}

$title = $ExeName + " " + $Version
if ($NoPublish) {
    Say "==> publish: skipped (-NoPublish)"
} elseif ($null -eq (Get-Command gh -ErrorAction SilentlyContinue)) {
    Say "==> publish: gh CLI not found -- create the release by hand:"
    Say ("    gh release create " + $Tag + " --title " + $title + " --notes-file " + $NotesFile + " " + $asset)
} else {
    & gh release view $Tag 1>$null 2>$null
    if ($LASTEXITCODE -eq 0) {
        Say ("==> publish: release " + $Tag + " already exists; not re-creating and not deleting anything")
        Say ("    if the asset is missing, attach it by hand: gh release upload " + $Tag + " " + $asset)
    } else {
        Say ("==> publish: creating GitHub release " + $Tag)
        if (Test-Path -LiteralPath $NotesFile -PathType Leaf) {
            Invoke-Step "gh" @("release", "create", $Tag, "--title", $title, "--notes-file", $NotesFile, $asset)
        } else {
            Say ("    !! " + $NotesFile + " not found; falling back to generated notes")
            Invoke-Step "gh" @("release", "create", $Tag, "--title", $title, "--generate-notes", $asset)
        }
    }
}

Say "==> done"
Say ("    commit : " + $headSha)
Say ("    tag    : " + $Tag)
Say ("    asset  : " + $asset)
Say "    next   : announce the release, then run the post-release checks"
