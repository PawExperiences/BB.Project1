# Release helper for e2e calculator 0.2.0.
# Builds the JAR, verifies the manifest, tags v0.2.0 (idempotent), pushes the
# tag, and creates the GitHub release via gh when available. Never deletes
# remote state; safe to re-run. Run from the repository root.
# Usage: powershell -File release/scripts/release.ps1
$ErrorActionPreference = 'Stop'

$Version = '0.2.0'
$Tag = "v$Version"
$Title = "e2e calculator $Version"
$MainClass = 'com.buildboard.calculator.Main'
$NotesFile = 'docs/releases/0-2-0.md'

Write-Host '==> Building with: mvn -B clean package (full test suite)'
mvn -B clean package
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }

$jars = @(Get-ChildItem -Path 'target' -Filter 'calculator-*.jar' |
          Where-Object { $_.Name -notlike '*-sources.jar' -and $_.Name -notlike '*-javadoc.jar' })
if ($jars.Count -ne 1) { throw "Expected exactly one target/calculator-*.jar, found $($jars.Count)." }
$Jar = $jars[0].FullName
Write-Host "==> Artifact: $Jar"

Write-Host '==> Verifying manifest Main-Class entry'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($Jar)
try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq 'META-INF/MANIFEST.MF' }
    if (-not $entry) { throw 'MANIFEST.MF not found in JAR.' }
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $manifest = $reader.ReadToEnd()
    $reader.Close()
} finally {
    $zip.Dispose()
}
if ($manifest -notmatch [regex]::Escape("Main-Class: $MainClass")) {
    throw "Manifest lacks 'Main-Class: $MainClass'."
}
Write-Host "    OK: Main-Class: $MainClass"

$localTag = git tag -l $Tag
if ($localTag -eq $Tag) {
    Write-Host "==> Tag $Tag already exists locally; leaving it untouched"
} else {
    Write-Host "==> Creating annotated tag $Tag"
    git tag -a $Tag -m $Title
    if ($LASTEXITCODE -ne 0) { throw 'git tag failed.' }
}

git ls-remote --exit-code --tags origin $Tag 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> Tag $Tag already on origin; not pushing"
} else {
    Write-Host '==> Pushing tag to origin'
    git push origin $Tag
    if ($LASTEXITCODE -ne 0) { throw 'git push failed.' }
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
    Write-Host '==> gh CLI not found; create the release manually with:'
    Write-Host "    gh release create $Tag $Jar --title `"$Title`" --notes-file $NotesFile"
    exit 0
}

gh release view $Tag 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> Release $Tag already exists; uploading asset with --clobber"
    gh release upload $Tag $Jar --clobber
} else {
    Write-Host "==> Creating GitHub release $Tag"
    if (Test-Path $NotesFile) {
        gh release create $Tag $Jar --title $Title --notes-file $NotesFile
    } else {
        gh release create $Tag $Jar --title $Title --notes 'See CHANGELOG.md for details.'
    }
}
if ($LASTEXITCODE -ne 0) { throw 'gh release step failed.' }
Write-Host "==> Done: release $Tag published with $Jar"
