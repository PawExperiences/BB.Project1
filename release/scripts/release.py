#!/usr/bin/env python3
"""Release script for e2e infra plan 0.1.0.
Runs fmt-check -> init -> validate -> plan (saved as an artifact) -> git tag -> GitHub release.
Run from the repository root, on the exact commit being released, after the
manual verification steps in the runbook are signed off. Idempotent: safe to re-run.
"""
import os
import shutil
import subprocess
import sys

VERSION = "0.1.0"
TAG = "v" + VERSION
ARTIFACT_DIR = os.path.join("release", "artifacts")
PLAN_FILE = os.path.join(ARTIFACT_DIR, "plan-{0}.tfplan".format(VERSION))
PLAN_TEXT = os.path.join(ARTIFACT_DIR, "plan-{0}.txt".format(VERSION))
NOTES_FILE = os.path.join("release", "RELEASE_NOTES_{0}.md".format(VERSION))


def run(cmd, capture=False):
    print("==> " + " ".join(cmd))
    if capture:
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, universal_newlines=True)
        return result.stdout
    subprocess.run(cmd, check=True)
    return ""


def require(tool):
    if shutil.which(tool) is None:
        print("ERROR: {0} is required".format(tool))
        sys.exit(1)


def main():
    print("==> Checking required tools (git, terraform)")
    require("git")
    require("terraform")

    print("==> Checking working tree is clean")
    status = run(["git", "status", "--porcelain"], capture=True)
    if status.strip():
        print("ERROR: working tree has uncommitted changes; commit or stash before releasing")
        sys.exit(1)

    print("==> Running terraform fmt -check -recursive")
    run(["terraform", "fmt", "-check", "-recursive"])

    print("==> Running terraform init (no backend, no credentials)")
    run(["terraform", "init", "-input=false"])

    print("==> Running terraform validate")
    run(["terraform", "validate"])

    if not os.path.isdir(ARTIFACT_DIR):
        os.makedirs(ARTIFACT_DIR)

    print("==> Running terraform plan and saving artifact to {0}".format(PLAN_FILE))
    run(["terraform", "plan", "-input=false", "-out=" + PLAN_FILE])
    plan_text = run(["terraform", "show", "-no-color", PLAN_FILE], capture=True)
    with open(PLAN_TEXT, "w") as f:
        f.write(plan_text)
    print("==> Plan artifact written to {0} and {1}".format(PLAN_FILE, PLAN_TEXT))

    tag_exists = subprocess.run(
        ["git", "rev-parse", TAG], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    ).returncode == 0
    if tag_exists:
        print("==> Tag {0} already exists locally, skipping tag creation".format(TAG))
    else:
        print("==> Creating annotated tag {0}".format(TAG))
        run(["git", "tag", "-a", TAG, "-m", "e2e infra plan {0}".format(VERSION)])

    print("==> Pushing tag {0} to origin (additive; never force-pushes or deletes)".format(TAG))
    run(["git", "push", "origin", TAG])

    if shutil.which("gh") is not None:
        release_exists = subprocess.run(
            ["gh", "release", "view", TAG], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        ).returncode == 0
        if release_exists:
            print("==> GitHub release {0} already exists, skipping release creation".format(TAG))
        else:
            title = "e2e infra plan {0}".format(VERSION)
            if os.path.isfile(NOTES_FILE):
                print("==> Creating GitHub release {0} from {1}".format(TAG, NOTES_FILE))
                run(["gh", "release", "create", TAG, PLAN_FILE, PLAN_TEXT,
                     "--title", title, "--notes-file", NOTES_FILE])
            else:
                print("==> {0} not found; creating GitHub release {1} with a minimal note".format(NOTES_FILE, TAG))
                run(["gh", "release", "create", TAG, PLAN_FILE, PLAN_TEXT,
                     "--title", title, "--notes", title])
    else:
        print("==> gh CLI not found; skipping GitHub release creation. Install gh and re-run, or create the release manually with tag {0}.".format(TAG))

    print("==> Release {0} complete".format(TAG))


if __name__ == "__main__":
    main()
