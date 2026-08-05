# release.ps1 — packages game files, creates git tag v0.1.0, pushes tag to origin.
# Run from the repository root after all manual checks pass.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Version  = '0.1.0'
$Tag      = "v$Version"
$ZipName  = "e2e-space-invaders-$Version.zip"
$Files    = @('index.html','game.js','gameConfig.js','input.js','player.js',
              'invaders.js','collision.js','explosion.js','level1.js','level2.js',
              'level3.js','boss.js','README.md')

# Move to repo root (script lives in release/scripts/)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir '../..')
Write-Host "Working in: $(Get-Location)"

# 1. Clean working tree check
$Status = & git status --porcelain 2>&1
if ($Status) {
    Write-Error 'Working tree is not clean. Commit or stash changes first.'
    exit 1
}
Write-Host 'Working tree is clean.'

# 2. Check required files
foreach ($f in $Files) {
    if (-not (Test-Path $f)) {
        Write-Error "Missing file: $f"
        exit 1
    }
}
Write-Host "All $($Files.Count) source files present."

# 3. Create zip artefact (idempotent: overwrite)
$OutDir = Join-Path 'release' 'scripts'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$OutPath = Join-Path $OutDir $ZipName
if (Test-Path $OutPath) { Remove-Item $OutPath -Force }
$AbsFiles = $Files | ForEach-Object { (Resolve-Path $_).Path }
Compress-Archive -Path $AbsFiles -DestinationPath $OutPath
Write-Host "Artefact created: $OutPath"

# 4. Create annotated tag (idempotent)
$ExistingTag = & git tag -l $Tag 2>&1
if ($ExistingTag -eq $Tag) {
    Write-Host "Tag $Tag already exists, skipping tag creation."
} else {
    & git tag -a $Tag -m "Release $Tag - initial four-level Space Invaders"
    Write-Host "Tag $Tag created."
}

# 5. Push tag
& git push origin $Tag
Write-Host "Tag $Tag pushed to origin."
Write-Host ""
Write-Host "Done. Upload $OutPath to the GitHub Release for $Tag."
