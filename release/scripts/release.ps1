# Release helper for romans 0.1.0 (e2e provider kimi).
# Runs the automated release steps and is safe to re-run:
#   1. builds the distribution with `uv build`
#   2. verifies the wheel ships romans/__init__.py, romans/table.py, romans/py.typed
#   3. creates the annotated git tag v0.1.0 (skipped if it already exists)
#   4. pushes the tag to origin
#   5. creates the GitHub release with the dist artifacts attached
#      (uses the gh CLI; prints the exact manual command if gh is absent)
# Run from the repository root AFTER the release-notes commit has landed:
#     powershell -File release/scripts/release.ps1

$Version = "0.1.0"
$Tag = "v$Version"
$Title = "e2e provider kimi $Version"
$NotesFile = "docs/releases/0-1-0.md"

if (-not (Test-Path "pyproject.toml")) {
    Write-Error "Run this script from the repository root (pyproject.toml not found)."
    exit 1
}
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Error "uv not found on PATH; see https://docs.astral.sh/uv/"
    exit 1
}

Write-Host "== 1/5 Building the distribution =="
uv build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "== 2/5 Verifying wheel contents =="
$Wheel = Get-ChildItem "dist/*.whl" | Select-Object -First 1
if (-not $Wheel) {
    Write-Error "No wheel found under dist/ after 'uv build'."
    exit 1
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$Zip = [System.IO.Compression.ZipFile]::OpenRead($Wheel.FullName)
try {
    $Names = $Zip.Entries | ForEach-Object { $_.FullName }
} finally {
    $Zip.Dispose()
}
foreach ($Member in @("romans/__init__.py", "romans/table.py", "romans/py.typed")) {
    if ($Names -notcontains $Member) {
        Write-Error "$($Wheel.Name) is missing expected member $Member"
        exit 1
    }
}
Write-Host "OK: $($Wheel.Name) contains romans/__init__.py, romans/table.py, romans/py.typed"

Write-Host "== 3/5 Tagging the release =="
git rev-parse -q --verify "refs/tags/$Tag" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists locally; skipping creation."
} else {
    git tag -a $Tag -m $Title
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "== 4/5 Pushing the tag =="
git push origin $Tag
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "== 5/5 Creating the GitHub release =="
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "gh CLI not found; create the release manually:"
    Write-Host "  gh release create $Tag dist/* --title '$Title' --notes-file $NotesFile"
    Write-Host "or use the GitHub web UI with the same title, notes and artifacts."
} else {
    gh release view $Tag 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "GitHub release $Tag already exists; skipping creation (no remote state is modified)."
    } else {
        $Artifacts = Get-ChildItem "dist/*" -File | ForEach-Object { $_.FullName }
        if (-not $Artifacts) {
            Write-Error "No artifacts under dist/ to attach to the release."
            exit 1
        }
        if (Test-Path $NotesFile) {
            gh release create $Tag @Artifacts --title $Title --notes-file $NotesFile
        } else {
            gh release create $Tag @Artifacts --title $Title --notes $Title
        }
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
}

Write-Host ""
Write-Host "Release $Tag prepared. Remaining manual step: publish to PyPI with 'uv publish'"
Write-Host "only if/when a human approves (project-name ownership + credentials required)."
