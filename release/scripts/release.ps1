# Release script for e2e infra plan 0.1.0.
# Runs fmt-check -> init -> validate -> plan (saved as an artifact) -> git tag -> GitHub release.
# Run from the repository root, on the exact commit being released, after the
# manual verification steps in the runbook are signed off. Idempotent: safe to re-run.

$ErrorActionPreference = "Stop"

$Version = "0.1.0"
$Tag = "v$Version"
$ArtifactDir = Join-Path "release" "artifacts"
$PlanFile = Join-Path $ArtifactDir "plan-$Version.tfplan"
$PlanText = Join-Path $ArtifactDir "plan-$Version.txt"
$NotesFile = Join-Path "release" "RELEASE_NOTES_$Version.md"

function Require-Tool {
    param([string]$Name)
    $found = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $found) {
        Write-Host "ERROR: $Name is required"
        exit 1
    }
}

Write-Host "==> Checking required tools (git, terraform)"
Require-Tool "git"
Require-Tool "terraform"

Write-Host "==> Checking working tree is clean"
$status = git status --porcelain
if ($status) {
    Write-Host "ERROR: working tree has uncommitted changes; commit or stash before releasing"
    exit 1
}

Write-Host "==> Running terraform fmt -check -recursive"
terraform fmt -check -recursive
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Running terraform init (no backend, no credentials)"
terraform init -input=false
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Running terraform validate"
terraform validate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path $ArtifactDir)) {
    New-Item -ItemType Directory -Path $ArtifactDir -Force | Out-Null
}

Write-Host "==> Running terraform plan and saving artifact to $PlanFile"
terraform plan -input=false -out="$PlanFile"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
terraform show -no-color "$PlanFile" | Out-File -FilePath $PlanText -Encoding ascii
Write-Host "==> Plan artifact written to $PlanFile and $PlanText"

git rev-parse $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> Tag $Tag already exists locally, skipping tag creation"
} else {
    Write-Host "==> Creating annotated tag $Tag"
    git tag -a $Tag -m "e2e infra plan $Version"
}

Write-Host "==> Pushing tag $Tag to origin (additive; never force-pushes or deletes)"
git push origin $Tag
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$gh = Get-Command "gh" -ErrorAction SilentlyContinue
if ($gh) {
    gh release view $Tag *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "==> GitHub release $Tag already exists, skipping release creation"
    } else {
        $title = "e2e infra plan $Version"
        if (Test-Path $NotesFile) {
            Write-Host "==> Creating GitHub release $Tag from $NotesFile"
            gh release create $Tag $PlanFile $PlanText --title $title --notes-file $NotesFile
        } else {
            Write-Host "==> $NotesFile not found; creating GitHub release $Tag with a minimal note"
            gh release create $Tag $PlanFile $PlanText --title $title --notes $title
        }
    }
} else {
    Write-Host "==> gh CLI not found; skipping GitHub release creation. Install gh and re-run, or create the release manually with tag $Tag."
}

Write-Host "==> Release $Tag complete"
