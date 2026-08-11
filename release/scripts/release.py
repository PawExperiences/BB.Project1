#!/usr/bin/env python3
import os
import subprocess
import sys

VERSION = "v0.1.0"
BINARY_NAME = "wordcount"
DIST_DIR = "dist"

TARGETS = [
    ("linux", "amd64", ""),
    ("linux", "arm64", ""),
    ("darwin", "amd64", ""),
    ("darwin", "arm64", ""),
    ("windows", "amd64", ".exe"),
]


def run(cmd, env=None):
    print("-- " + " ".join(cmd))
    subprocess.run(cmd, env=env, check=True)


def main():
    print("== e2e word count release %s ==" % VERSION)

    print("-- Running gofmt check")
    result = subprocess.run(["gofmt", "-l", "."], capture_output=True, text=True, check=True)
    if result.stdout.strip():
        sys.stderr.write("gofmt found unformatted files:\n" + result.stdout)
        sys.exit(1)

    run(["go", "build", "./..."])
    run(["go", "test", "./..."])

    print("-- Preparing dist directory: %s" % DIST_DIR)
    os.makedirs(DIST_DIR, exist_ok=True)

    for goos, goarch, ext in TARGETS:
        out = os.path.join(DIST_DIR, "%s_%s_%s%s" % (BINARY_NAME, goos, goarch, ext))
        print("-- Building %s" % out)
        env = os.environ.copy()
        env["GOOS"] = goos
        env["GOARCH"] = goarch
        run(["go", "build", "-o", out, "."], env=env)

    print("-- Tagging %s (skipped if it already exists)" % VERSION)
    tag_exists = subprocess.run(["git", "rev-parse", VERSION], capture_output=True).returncode == 0
    if tag_exists:
        print("Tag %s already exists locally, skipping tag creation" % VERSION)
    else:
        run(["git", "tag", "-a", VERSION, "-m", "e2e word count %s" % VERSION])

    print("-- Pushing tag %s to origin (additive only)" % VERSION)
    run(["git", "push", "origin", VERSION])

    gh_found = False
    for p in os.environ.get("PATH", "").split(os.pathsep):
        for name in ("gh", "gh.exe"):
            candidate = os.path.join(p, name)
            if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                gh_found = True
                break
        if gh_found:
            break

    if gh_found:
        print("-- Publishing GitHub release via gh CLI")
        release_exists = subprocess.run(["gh", "release", "view", VERSION], capture_output=True).returncode == 0
        if release_exists:
            print("Release %s already exists on GitHub, skipping creation" % VERSION)
        else:
            artifacts = [os.path.join(DIST_DIR, f) for f in sorted(os.listdir(DIST_DIR))]
            run(["gh", "release", "create", VERSION] + artifacts +
                ["--title", "e2e word count %s" % VERSION, "--notes-file", "RELEASE_NOTES.md"])
    else:
        sys.stderr.write("gh CLI not found; skipping GitHub release publish step.\n")
        sys.stderr.write("Install https://cli.github.com/ or publish manually with the artifacts in %s\n" % DIST_DIR)

    print("== Release %s complete ==" % VERSION)


if __name__ == "__main__":
    main()
