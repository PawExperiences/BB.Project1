# release.ps1 - pre-flight check and artefact packager for e2e Space Invaders 0.1.0.
# Verifies required files exist, then zips them into e2e-space-invaders-0.1.0.zip.
# Run from the repository root before pushing the v0.1.0 tag.

$Version  = '0.1.0'
$Artifact = "e2e-space-invaders-$Version.zip"
$Required = @(
    'index.html', 'game.js', 'gameConfig.js', 'input.js', 'player.js',
    'invaders.js', 'collision.js', 'level1.js', 'level2.js', 'level3.js',
    'boss.js', 'README.md'
)

Write-Host "[release.ps1] e2e Space Invaders $Version - pre-flight check"
$Failed = $false
foreach ($f in $Required) {
    if (Test-Path $f -PathType Leaf) {
        Write-Host "  [OK] $f"
    } else {
        Write-Host "  [MISSING] $f"
        $Failed = $true
    }
}

if ($Failed) {
    Write-Host ""`nPre-flight FAILED. See MISSING files above."
    exit 1
}

Write-Host ""`n[release.ps1] All required files present. Creating $Artifact ..."
# Remove stale artefact if present (idempotent)
if (Test-Path $Artifact) { Remove-Item $Artifact }

$Files = $Required | ForEach-Object { Get-Item $_ }
Compress-Archive -Path $Files -DestinationPath $Artifact
$Size = (Get-Item $Artifact).Length
Write-Host "[release.ps1] Artefact created: $Artifact ($Size bytes)"
Write-Host "[release.ps1] Next step: push tag v0.1.0, then upload this zip to GitHub Releases."
