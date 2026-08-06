#!/usr/bin/env python3
"""release.py — tag, build, package, and publish prime_tester 0.3.0 to GitHub Releases."""
import subprocess, sys, os, platform, shutil, tarfile, zipfile

VERSION = "0.3.0"
TAG = f"v{VERSION}"
REPO = "PawExperiences/BB.Project1"
BUILD_DIR = "build"
DIST_DIR = "dist"

def run(cmd, **kw):
    print(f"+ {' '.join(cmd)}")
    result = subprocess.run(cmd, **kw)
    if result.returncode != 0:
        sys.exit(result.returncode)
    return result

def main():
    # 1. Ensure working tree is clean enough (tag step is additive only)
    run(["git", "fetch", "--tags"])
    tags = subprocess.run(["git", "tag", "-l", TAG], capture_output=True, text=True).stdout.strip()
    if not tags:
        run(["git", "tag", "-a", TAG, "-m", f"Release e2e prime tester {VERSION}"])
        run(["git", "push", "origin", TAG])
    else:
        print(f"Tag {TAG} already exists — skipping tag creation.")

    # 2. Build
    os.makedirs(BUILD_DIR, exist_ok=True)
    run(["cmake", "-B", BUILD_DIR, "-DCMAKE_BUILD_TYPE=Release"])
    run(["cmake", "--build", BUILD_DIR, "--config", "Release"])

    # 3. Locate executable
    exe = os.path.join(BUILD_DIR, "prime_tester")
    if platform.system() == "Windows":
        exe_candidates = [
            os.path.join(BUILD_DIR, "Release", "prime_tester.exe"),
            os.path.join(BUILD_DIR, "prime_tester.exe"),
        ]
        exe = next((c for c in exe_candidates if os.path.isfile(c)), None)
    if not exe or not os.path.isfile(exe):
        print("ERROR: built executable not found.", file=sys.stderr)
        sys.exit(1)

    # 4. Package
    os.makedirs(DIST_DIR, exist_ok=True)
    system_tag = platform.system().lower()
    if platform.system() == "Windows":
        archive_name = f"prime_tester-{VERSION}-{system_tag}.zip"
        archive_path = os.path.join(DIST_DIR, archive_name)
        with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.write(exe, os.path.basename(exe))
    else:
        archive_name = f"prime_tester-{VERSION}-{system_tag}.tar.gz"
        archive_path = os.path.join(DIST_DIR, archive_name)
        with tarfile.open(archive_path, "w:gz") as tf:
            tf.add(exe, arcname=os.path.basename(exe))
    print(f"Packaged: {archive_path}")

    # 5. Upload to GitHub Release (requires gh CLI)
    run(["gh", "release", "create", TAG,
         "--repo", REPO,
         "--title", f"e2e prime tester {VERSION}",
         "--notes", f"Release {VERSION} of the e2e prime tester project.",
         archive_path])
    print("Release published successfully.")

if __name__ == "__main__":
    main()
