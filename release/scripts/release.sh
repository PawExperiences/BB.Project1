#!/bin/sh
# Release script for e2e infra plan 0.1.0.
# Runs fmt-check -> init -> validate -> plan (saved as an artifact) -> git tag -> GitHub release.
# Run from the repository root, on the exact commit being released, after the
# manual verification steps in the runbook are signed off. Idempotent: safe to re-run.
set -eu

VERSION="0.1.0"
TAG="v${VERSION}"
ARTIFACT_DIR="release/artifacts"
PLAN_FILE="${ARTIFACT_DIR}/plan-${VERSION}.tfplan"
PLAN_TEXT="${ARTIFACT_DIR}/plan-${VERSION}.txt"
NOTES_FILE="release/RELEASE_NOTES_${VERSION}.md"

echo "==> Checking required tools (git, terraform)"
command -v git >/dev/null 2>&1 || { echo "ERROR: git is required"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "ERROR: terraform is required"; exit 1; }

echo "==> Checking working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree has uncommitted changes; commit or stash before releasing"
  exit 1
fi

echo "==> Running terraform fmt -check -recursive"
terraform fmt -check -recursive

echo "==> Running terraform init (no backend, no credentials)"
terraform init -input=false

echo "==> Running terraform validate"
terraform validate

mkdir -p "$ARTIFACT_DIR"

echo "==> Running terraform plan and saving artifact to ${PLAN_FILE}"
terraform plan -input=false -out="$PLAN_FILE"
terraform show -no-color "$PLAN_FILE" > "$PLAN_TEXT"
echo "==> Plan artifact written to ${PLAN_FILE} and ${PLAN_TEXT}"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "==> Tag ${TAG} already exists locally, skipping tag creation"
else
  echo "==> Creating annotated tag ${TAG}"
  git tag -a "$TAG" -m "e2e infra plan ${VERSION}"
fi

echo "==> Pushing tag ${TAG} to origin (additive; never force-pushes or deletes)"
git push origin "$TAG"

if command -v gh >/dev/null 2>&1; then
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "==> GitHub release ${TAG} already exists, skipping release creation"
  else
    if [ -f "$NOTES_FILE" ]; then
      echo "==> Creating GitHub release ${TAG} from ${NOTES_FILE}"
      gh release create "$TAG" "$PLAN_FILE" "$PLAN_TEXT" --title "e2e infra plan ${VERSION}" --notes-file "$NOTES_FILE"
    else
      echo "==> ${NOTES_FILE} not found; creating GitHub release ${TAG} with a minimal note"
      gh release create "$TAG" "$PLAN_FILE" "$PLAN_TEXT" --title "e2e infra plan ${VERSION}" --notes "e2e infra plan ${VERSION}"
    fi
  fi
else
  echo "==> gh CLI not found; skipping GitHub release creation. Install gh and re-run, or create the release manually with tag ${TAG}."
fi

echo "==> Release ${TAG} complete"
