# Automated release script for wordcount v0.1.0.
# Runs the verification suite, cross-builds release binaries, tags the
# repo, and publishes a GitHub release with the changelog notes.
# Run from the repository root after all release checks pass.
# Idempotent: safe to re-run; skips steps that are already done.

$Version = '0.1.0'
$Tag = "v$Version"
$Module = 'wordcount'
$DistDir = 'dist'
$NotesFile = Join-Path 'release' 'RELEASE_NOTES.md'
$Targets = @(
    @{ GOOS = 'linux';   GOARCH = 'amd64' },
    @{ GOOS = 'darwin';  GOARCH = 'amd64' },
    @{ GOOS = 'darwin';  GOARCH = 'arm64' },
    @{ GOOS = 'windows'; GOARCH = 'amd64' }
)

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Checked {
    param([string]$Description)
    if ($LASTEXITCODE -ne 0) {
        Write-Error "error: $Description failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
}

if (-not (Test-CommandExists 'go')) {
    Write-Error 'error: go toolchain not found on PATH'
    exit 1
}
if (-not (Test-CommandExists 'git')) {
    Write-Error 'error: git not found on PATH'
    exit 1
}

Write-Host '== running verification suite =='
& go build ./...
Invoke-Checked 'go build ./...'
& go vet ./...
Invoke-Checked 'go vet ./...'
& go test ./...
Invoke-Checked 'go test ./...'

$unformatted = & gofmt -l .
if ($unformatted) {
    Write-Error "error: gofmt reports unformatted files:`n$unformatted"
    exit 1
}

Write-Host '== building release binaries =='
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null
foreach ($t in $Targets) {
    $ext = ''
    if ($t.GOOS -eq 'windows') { $ext = '.exe' }
    $out = Join-Path $DistDir "$Module-$Version-$($t.GOOS)-$($t.GOARCH)$ext"
    Write-Host "+ GOOS=$($t.GOOS) GOARCH=$($t.GOARCH) go build -o $out ."
    $env:GOOS = $t.GOOS
    $env:GOARCH = $t.GOARCH
    $env:CGO_ENABLED = '0'
    & go build -o $out .
    Invoke-Checked "go build for $($t.GOOS)/$($t.GOARCH)"
    Write-Host "built $out"
}
Remove-Item Env:\GOOS -ErrorAction SilentlyContinue
Remove-Item Env:\GOARCH -ErrorAction SilentlyContinue
Remove-Item Env:\CGO_ENABLED -ErrorAction SilentlyContinue

Write-Host '== tagging release =='
& git rev-parse -q --verify "refs/tags/$Tag" 2>$null 1>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "$Tag already exists locally, skipping tag creation"
} else {
    & git tag -a $Tag -m "Release $Tag"
    Invoke-Checked "git tag $Tag"
}
& git push origin $Tag
Invoke-Checked "git push origin $Tag"

Write-Host '== publishing GitHub release =='
if (-not (Test-CommandExists 'gh')) {
    Write-Host 'gh CLI not found; skipping automated publish.'
    Write-Host "Publish manually: create a GitHub release for $Tag using $NotesFile as the body and upload files from $DistDir"
    exit 0
}

& gh release view $Tag 2>$null 1>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "$Tag release already exists on GitHub, skipping create"
} else {
    $artifacts = Get-ChildItem -Path $DistDir | ForEach-Object { $_.FullName }
    & gh release create $Tag $artifacts --title $Tag --notes-file $NotesFile
    Invoke-Checked "gh release create $Tag"
}

Write-Host "release $Tag complete"
