# Performs the automated release steps for todo-api v0.1.0
# (build+test, version bump, git tag, push, GitHub release, artifact upload).
# Run from a clean checkout of the commit you intend to release, on a machine
# with push access to origin and an authenticated gh CLI.

$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$Title = "todo-api v$Version"
$ArtifactDir = "dist"
$ArtifactName = "todo-api-$Version.tar.gz"
$NotesFile = "release/RELEASE_NOTES.md"

Write-Host "==> Checking working tree is clean"
$status = git status --porcelain
if ($status) {
    Write-Error "Working tree has uncommitted changes. Commit or stash first."
    exit 1
}

Write-Host "==> Installing dependencies"
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Building (TypeScript strict compile)"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Running tests (Vitest)"
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Ensuring package.json version is $Version"
$pkgPath = "package.json"
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
if ($pkg.version -ne $Version) {
    $pkg.version = $Version
    ($pkg | ConvertTo-Json -Depth 100) | Set-Content -Path $pkgPath -Encoding UTF8
    git add package.json
    git commit -m "chore(release): v$Version"
    Write-Host "    package.json version bumped and committed."
} else {
    Write-Host "    package.json already at $Version, skipping commit."
}

Write-Host "==> Tagging release"
git rev-parse -q --verify "refs/tags/$Tag" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Tag $Tag already exists, skipping."
} else {
    git tag -a $Tag -m $Title
    Write-Host "    Created tag $Tag."
}

Write-Host "==> Pushing branch and tag to origin"
git push origin HEAD
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git push origin $Tag
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if ($ghPath) {
    Write-Host "==> Checking GitHub release"
    gh release view $Tag 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    Release $Tag already exists, skipping creation."
    } else {
        if (Test-Path $NotesFile) {
            gh release create $Tag --title $Title --notes-file $NotesFile
        } else {
            gh release create $Tag --title $Title --notes "Release $Title. See CHANGELOG.md for details."
        }
        Write-Host "    Created release $Tag."
    }

    Write-Host "==> Packaging and uploading artifact"
    if (Test-Path $ArtifactDir) {
        if (Get-Command tar -ErrorAction SilentlyContinue) {
            tar -czf $ArtifactName -C $ArtifactDir .
        } else {
            Compress-Archive -Path "$ArtifactDir/*" -DestinationPath "todo-api-$Version.zip" -Force
            $ArtifactName = "todo-api-$Version.zip"
        }
        $existing = gh release view $Tag --json assets --jq ".assets[].name" 2>$null
        if ($existing -contains $ArtifactName) {
            Write-Host "    Asset $ArtifactName already attached, skipping upload."
        } else {
            gh release upload $Tag $ArtifactName
            Write-Host "    Uploaded $ArtifactName."
        }
    } else {
        Write-Warning "$ArtifactDir not found, skipping artifact upload."
    }
} else {
    Write-Host "==> 'gh' CLI not found; skipping GitHub release creation and artifact upload."
    Write-Host "    Install https://cli.github.com and re-run, or create the release manually."
}

Write-Host "==> Release $Tag complete."
