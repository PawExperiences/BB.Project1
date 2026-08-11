# Idempotent release script for e2e word count.
$ErrorActionPreference = "Stop"

$Version = "v0.1.0"
$BinaryName = "wordcount"
$DistDir = "dist"

Write-Host "== e2e word count release $Version =="

Write-Host "-- Running gofmt check"
$Unformatted = & gofmt -l .
if ($LASTEXITCODE -ne 0) { throw "gofmt failed" }
if ($Unformatted) {
    Write-Host "gofmt found unformatted files:"
    Write-Host $Unformatted
    exit 1
}

Write-Host "-- Running go build"
& go build ./...
if ($LASTEXITCODE -ne 0) { throw "go build failed" }

Write-Host "-- Running go test"
& go test ./...
if ($LASTEXITCODE -ne 0) { throw "go test failed" }

Write-Host "-- Preparing dist directory: $DistDir"
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

$Targets = @(
    @{ GOOS = "linux"; GOARCH = "amd64"; Ext = "" },
    @{ GOOS = "linux"; GOARCH = "arm64"; Ext = "" },
    @{ GOOS = "darwin"; GOARCH = "amd64"; Ext = "" },
    @{ GOOS = "darwin"; GOARCH = "arm64"; Ext = "" },
    @{ GOOS = "windows"; GOARCH = "amd64"; Ext = ".exe" }
)

foreach ($Target in $Targets) {
    $Out = Join-Path $DistDir ("{0}_{1}_{2}{3}" -f $BinaryName, $Target.GOOS, $Target.GOARCH, $Target.Ext)
    Write-Host "-- Building $Out"
    $env:GOOS = $Target.GOOS
    $env:GOARCH = $Target.GOARCH
    & go build -o $Out .
    if ($LASTEXITCODE -ne 0) { throw "go build failed for $Out" }
}
Remove-Item Env:\GOOS -ErrorAction SilentlyContinue
Remove-Item Env:\GOARCH -ErrorAction SilentlyContinue

Write-Host "-- Tagging $Version (skipped if it already exists)"
& git rev-parse $Version *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Version already exists locally, skipping tag creation"
} else {
    & git tag -a $Version -m "e2e word count $Version"
}

Write-Host "-- Pushing tag $Version to origin (additive only)"
& git push origin $Version

$GhCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($GhCmd) {
    Write-Host "-- Publishing GitHub release via gh CLI"
    & gh release view $Version *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Release $Version already exists on GitHub, skipping creation"
    } else {
        $Artifacts = Get-ChildItem -Path $DistDir | ForEach-Object { $_.FullName }
        & gh release create $Version $Artifacts --title "e2e word count $Version" --notes-file "RELEASE_NOTES.md"
    }
} else {
    Write-Host "gh CLI not found; skipping GitHub release publish step."
    Write-Host "Install https://cli.github.com/ or publish manually with the artifacts in $DistDir"
}

Write-Host "== Release $Version complete =="
