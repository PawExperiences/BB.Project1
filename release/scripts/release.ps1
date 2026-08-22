# release.ps1 - tag, package and publish the Space Invaders release.
#
# WHAT IT DOES
#   1. refuses to run on a dirty working tree
#   2. creates the annotated tag v<version> on HEAD (skipped if it exists)
#   3. pushes the tag to the remote (skipped if the remote already has it)
#   4. packages the tagged tree into <Dist>\space-invaders-<version>.zip
#   5. publishes the GitHub release from the notes file and uploads the zip,
#      when the GitHub CLI (gh) is installed and authenticated
#
# WHEN TO RUN IT
#   From the repository root, after the release-notes PR is merged and CI on the
#   release commit is green - steps 9 to 11 of the release runbook.
#
# Idempotent and additive: already-done work is skipped and nothing is ever
# deleted, moved or force-pushed.  If the tag exists but points somewhere other
# than HEAD the script stops and asks a human.
#
# Windows PowerShell 5.1 compatible (no PS7-only syntax).

param(
    [string]$Version = "0.5.0",
    [string]$Remote = "origin",
    [string]$Notes = "docs/releases/0-5-0.md",
    [string]$Dist = "dist",
    [switch]$AllowDirty,
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

$TitleText = "e2e space invaders cc"
$Tag = "v$Version"
$ZipName = "space-invaders-$Version.zip"

function Say([string]$Message) {
    Write-Host "[release] $Message"
}

function Invoke-Git {
    param([string[]]$Arguments, [switch]$AllowFailure)
    $raw = & git @Arguments 2>&1
    $code = $LASTEXITCODE
    $text = ($raw | Out-String).Trim()
    if ($code -ne 0 -and -not $AllowFailure) {
        Say ("FAILED: git " + ($Arguments -join " "))
        if ($text) { Write-Host $text }
        exit 1
    }
    return @{ Code = $code; Text = $text }
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Say "git is not on PATH - cannot continue"
    exit 1
}

$root = (Invoke-Git -Arguments @("rev-parse", "--show-toplevel")).Text
Set-Location $root
Say "repository root: $root"
if ($DryRun) { Say "DRY RUN - nothing will be created, pushed or published" }

$zipPath = Join-Path $Dist $ZipName

$dirty = (Invoke-Git -Arguments @("status", "--porcelain")).Text
if ($dirty -and -not $AllowDirty) {
    Say "working tree is not clean - commit or stash first (or pass -AllowDirty):"
    Write-Host $dirty
    exit 1
}

$headSha = (Invoke-Git -Arguments @("rev-parse", "HEAD")).Text
Say "HEAD is $headSha"

# 1. annotated tag ------------------------------------------------------------
$tagProbe = Invoke-Git -Arguments @("rev-parse", "-q", "--verify", "refs/tags/$Tag") -AllowFailure
if ($tagProbe.Code -eq 0) {
    $tagSha = (Invoke-Git -Arguments @("rev-parse", "$Tag^{commit}")).Text
    if ($tagSha -ne $headSha) {
        Say "tag $Tag already exists and points at $tagSha, not HEAD ($headSha)."
        Say "refusing to move or delete an existing tag - ask a human."
        exit 1
    }
    Say "tag $Tag already exists on HEAD - skipping"
} else {
    if ($DryRun) {
        Say "would run: git tag -a $Tag -m '$TitleText $Version'"
    } else {
        Invoke-Git -Arguments @("tag", "-a", $Tag, "-m", "$TitleText $Version") | Out-Null
        Say "created annotated tag $Tag"
    }
}

# 2. push the tag -------------------------------------------------------------
$remoteTag = (Invoke-Git -Arguments @("ls-remote", "--tags", $Remote, "refs/tags/$Tag") -AllowFailure).Text
if ($remoteTag) {
    Say "tag $Tag is already on $Remote - skipping push"
} elseif ($DryRun) {
    Say "would run: git push $Remote $Tag"
} else {
    Invoke-Git -Arguments @("push", $Remote, $Tag) | Out-Null
    Say "pushed $Tag to $Remote"
}

# 3. package the artifact -----------------------------------------------------
if (Test-Path $zipPath) {
    Say "artifact $zipPath already exists - skipping packaging"
} elseif ($DryRun) {
    Say "would package $zipPath from $Tag"
} else {
    if (-not (Test-Path $Dist)) {
        New-Item -ItemType Directory -Path $Dist | Out-Null
    }
    Invoke-Git -Arguments @("archive", "--format=zip", "--prefix=space-invaders-$Version/", "-o", $zipPath, $Tag) | Out-Null
    Say "packaged $zipPath"
}

# 4. publish -------------------------------------------------------------------
$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
    Say "GitHub CLI (gh) not found - the tag and the artifact are ready."
    Say "publish by hand with:"
    Say "  gh release create $Tag --title '$TitleText $Version' --notes-file $Notes"
    Say "  gh release upload $Tag $zipPath"
    exit 0
}

& gh release view $Tag 2>$null | Out-Null
$releaseExists = ($LASTEXITCODE -eq 0)
if ($releaseExists) {
    Say "GitHub release $Tag already exists - skipping create"
} elseif ($DryRun) {
    Say "would run: gh release create $Tag --notes-file $Notes"
} else {
    if (-not (Test-Path $Notes)) {
        Say "notes file $Notes is missing - write it first (runbook step 6)"
        exit 1
    }
    & gh release create $Tag --title "$TitleText $Version" --notes-file $Notes
    if ($LASTEXITCODE -ne 0) {
        Say "gh release create failed"
        exit 1
    }
    Say "published GitHub release $Tag"
}

$assetText = & gh release view $Tag --json assets --jq ".assets[].name" 2>$null
if ($LASTEXITCODE -ne 0) { $assetText = "" }
$assets = @()
if ($assetText) { $assets = ($assetText | Out-String).Split("`n") | ForEach-Object { $_.Trim() } }

if ($assets -contains $ZipName) {
    Say "asset $ZipName is already attached to $Tag - skipping upload"
} elseif ($DryRun) {
    Say "would run: gh release upload $Tag $zipPath"
} elseif (-not (Test-Path $zipPath)) {
    Say "artifact $zipPath is missing - nothing to upload"
} else {
    & gh release upload $Tag $zipPath
    if ($LASTEXITCODE -ne 0) {
        Say "gh release upload failed"
        exit 1
    }
    Say "uploaded $zipPath"
}

Say "done - $Tag is tagged, packaged and published. Nothing was deleted."
