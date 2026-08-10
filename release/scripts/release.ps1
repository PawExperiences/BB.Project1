$ErrorActionPreference = "Stop"

if ($env:VERSION) { $Version = $env:VERSION } else { $Version = "0.4.0" }
if ($env:TAG) { $Tag = $env:TAG } else { $Tag = "v$Version" }
if ($env:ARTIFACT) { $Artifact = $env:ARTIFACT } else { $Artifact = "target/calculator-0.1.0.jar" }
if ($env:TITLE) { $Title = $env:TITLE } else { $Title = "e2e calculator cc $Version" }
if ($env:NOTES_FILE) { $NotesFile = $env:NOTES_FILE } else { $NotesFile = "release/notes/RELEASE_NOTES.md" }

Write-Host "== release.ps1: releasing $Tag =="

Write-Host "-> checking working tree is clean"
$status = git status --porcelain
if ($status) {
    Write-Error "ERROR: working tree is not clean. Commit or stash changes first."
    exit 1
}

Write-Host "-> running test suite (mvn -B test)"
mvn -B test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "-> building artifact (mvn -B package)"
mvn -B package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path $Artifact)) {
    Write-Error "ERROR: expected artifact not found at $Artifact"
    exit 1
}
Write-Host "-> artifact present: $Artifact"

git rev-parse $Tag 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "-> tag $Tag already exists locally, skipping tag creation"
} else {
    Write-Host "-> creating annotated tag $Tag"
    git tag -a $Tag -m $Title
}

$remoteTag = git ls-remote --tags origin "refs/tags/$Tag"
if ($remoteTag) {
    Write-Host "-> tag $Tag already present on origin, skipping push"
} else {
    Write-Host "-> pushing tag $Tag to origin"
    git push origin $Tag
}

$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghCmd) {
    Write-Warning "gh CLI not found; skipping GitHub release creation."
    exit 0
}

gh release view $Tag 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "-> GitHub release $Tag already exists, uploading/overwriting artifact only"
    gh release upload $Tag $Artifact --clobber
} else {
    Write-Host "-> creating GitHub release $Tag"
    if (Test-Path $NotesFile) {
        gh release create $Tag $Artifact --title $Title --notes-file $NotesFile
    } else {
        Write-Warning "$NotesFile not found, creating release with a placeholder note"
        gh release create $Tag $Artifact --title $Title --notes "See CHANGELOG.md"
    }
}

Write-Host "== release.ps1: done =="
