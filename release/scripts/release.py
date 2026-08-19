#!/usr/bin/env python3
"""Release helper for e2e calculator 0.2.0.

Runs the full Maven build, verifies the JAR manifest, creates and pushes the
v0.2.0 tag when missing, and creates the GitHub release with the JAR attached
(needs the gh CLI; otherwise prints the exact command). Idempotent: existing
tags/releases are detected and left in place -- nothing remote is ever deleted.
Run from the repository root after the release tree and version are confirmed.
"""

import glob
import os
import shutil
import subprocess
import sys
import zipfile

VERSION = "0.2.0"
TAG = "v" + VERSION
TITLE = "e2e calculator " + VERSION
MAIN_CLASS = "com.buildboard.calculator.Main"
NOTES_FILE = os.path.join("docs", "releases", "0-2-0.md")


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def find_jar():
    jars = [
        j for j in glob.glob(os.path.join("target", "calculator-*.jar"))
        if not j.endswith("-sources.jar") and not j.endswith("-javadoc.jar")
    ]
    if len(jars) != 1:
        sys.exit("ERROR: expected exactly one target/calculator-*.jar, found %d: %s"
                 % (len(jars), jars))
    return jars[0]


def tag_on_origin():
    return subprocess.run(
        ["git", "ls-remote", "--exit-code", "--tags", "origin", TAG],
        capture_output=True,
    ).returncode == 0


def main():
    print("==> Building with: mvn -B clean package (full test suite)")
    run(["mvn", "-B", "clean", "package"])

    jar = find_jar()
    print("==> Artifact: " + jar)

    print("==> Verifying manifest Main-Class entry")
    with zipfile.ZipFile(jar) as zf:
        manifest = zf.read("META-INF/MANIFEST.MF").decode("utf-8", "replace")
    if ("Main-Class: " + MAIN_CLASS) not in manifest:
        sys.exit("ERROR: %s manifest lacks 'Main-Class: %s'" % (jar, MAIN_CLASS))
    print("    OK: Main-Class: " + MAIN_CLASS)

    local = subprocess.run(["git", "tag", "-l", TAG],
                           capture_output=True, text=True).stdout.strip()
    if local == TAG:
        print("==> Tag %s already exists locally; leaving it untouched" % TAG)
    else:
        print("==> Creating annotated tag " + TAG)
        run(["git", "tag", "-a", TAG, "-m", TITLE])

    if tag_on_origin():
        print("==> Tag %s already on origin; not pushing" % TAG)
    else:
        print("==> Pushing tag to origin")
        run(["git", "push", "origin", TAG])

    if shutil.which("gh") is None:
        print("==> gh CLI not found; create the release manually with:")
        print('    gh release create %s "%s" --title "%s" --notes-file %s'
              % (TAG, jar, TITLE, NOTES_FILE))
        return

    if subprocess.run(["gh", "release", "view", TAG],
                      capture_output=True).returncode == 0:
        print("==> Release %s already exists; uploading asset with --clobber" % TAG)
        run(["gh", "release", "upload", TAG, jar, "--clobber"])
    else:
        print("==> Creating GitHub release " + TAG)
        cmd = ["gh", "release", "create", TAG, jar, "--title", TITLE]
        if os.path.exists(NOTES_FILE):
            cmd += ["--notes-file", NOTES_FILE]
        else:
            cmd += ["--notes", "See CHANGELOG.md for details."]
        run(cmd)

    print("==> Done: release %s published with %s" % (TAG, jar))


if __name__ == "__main__":
    main()
