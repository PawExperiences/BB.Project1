#!/usr/bin/env python3
"""BuildBoard release helper: tags, builds and publishes a GitHub Release.

Usage:
    GITHUB_TOKEN=... python3 release/scripts/release.py

Env vars:
    RELEASE_VERSION     default "0.6.0" -- matches the delivery resource's
                         tag_template "{version}" (no "v" prefix).
    GITHUB_REPO          default "PawExperiences/BB.Project1"
    GITHUB_TOKEN          REQUIRED -- a token with repo Contents read/write.
                         Read from the environment only; never hardcode it.
    BUILD_DIR             default "build" -- matches the project's
                         toolchain-cpp artifact_path.
    RELEASE_NOTES_FILE    default "RELEASE_NOTES.md" -- markdown body for the
                         GitHub Release; falls back to a one-line body if absent.

Every step is idempotent: re-running after a partial failure skips work
already done (existing tag, existing release, existing asset) instead of
erroring.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
VERSION = os.environ.get("RELEASE_VERSION", "0.6.0")
REPO = os.environ.get("GITHUB_REPO", "PawExperiences/BB.Project1")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
BUILD_DIR = os.environ.get("BUILD_DIR", "build")
NOTES_FILE = os.environ.get("RELEASE_NOTES_FILE", "RELEASE_NOTES.md")
API = "https://api.github.com"


def run(cmd, cwd=REPO_ROOT, check=True):
    print("+ " + " ".join(cmd))
    result = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    if result.stdout.strip():
        print(result.stdout.strip())
    if check and result.returncode != 0:
        print(result.stderr.strip(), file=sys.stderr)
        sys.exit(result.returncode)
    return result


def api(method, path, body=None, raw=None, extra_headers=None):
    if not TOKEN:
        print("GITHUB_TOKEN is not set -- export a token with Contents: read/write and retry", file=sys.stderr)
        sys.exit(1)
    url = path if path.startswith("http") else API + path
    headers = {
        "Authorization": "Bearer " + TOKEN,
        "Accept": "application/vnd.github+json",
        "User-Agent": "buildboard-release-script",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = raw if raw is not None else (json.dumps(body).encode("utf-8") if body is not None else None)
    if data is not None and raw is None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            payload = resp.read()
            return resp.status, (json.loads(payload) if payload else {})
    except urllib.error.HTTPError as exc:
        payload = exc.read()
        try:
            return exc.code, json.loads(payload)
        except ValueError:
            return exc.code, {"message": payload.decode("utf-8", "replace")}


def ensure_tag():
    existing = run(["git", "tag", "--list", VERSION], check=False)
    if VERSION in existing.stdout.split():
        print(f"tag {VERSION} already exists locally -- skipping tag creation")
    else:
        run(["git", "tag", "-a", VERSION, "-m", f"Release {VERSION}"])
    remote = run(["git", "ls-remote", "--tags", "origin", VERSION], check=False)
    if VERSION in remote.stdout:
        print(f"tag {VERSION} already on origin -- skipping push")
    else:
        run(["git", "push", "origin", f"refs/tags/{VERSION}"])


def build():
    cmakelists = REPO_ROOT / "CMakeLists.txt"
    if not cmakelists.exists():
        print(
            f"no CMakeLists.txt at {REPO_ROOT} -- nothing to build; the release will be "
            "tagged and published WITHOUT a binary asset. Confirm this is expected before "
            "continuing (see the runbook's pre-flight step)."
        )
        return None
    build_dir = REPO_ROOT / BUILD_DIR
    run(["cmake", "-S", str(REPO_ROOT), "-B", str(build_dir), "-DCMAKE_BUILD_TYPE=Release"])
    run(["cmake", "--build", str(build_dir)])
    return build_dir


def package_artifact(build_dir):
    if build_dir is None:
        return None
    archive = REPO_ROOT / f"{BUILD_DIR}-{VERSION}.zip"
    if archive.exists():
        print(f"{archive.name} already exists -- reusing it")
        return archive
    print(f"packaging {build_dir} -> {archive.name}")
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in build_dir.rglob("*"):
            if path.is_file() and "CMakeFiles" not in path.parts:
                zf.write(path, path.relative_to(build_dir))
    return archive


def ensure_release():
    status, existing = api("GET", f"/repos/{REPO}/releases/tags/{VERSION}")
    if status == 200:
        print(f"GitHub release {VERSION} already exists -- reusing it (id {existing['id']})")
        return existing
    notes_path = REPO_ROOT / NOTES_FILE
    body = notes_path.read_text(encoding="utf-8") if notes_path.exists() else f"Release {VERSION}."
    status, created = api(
        "POST",
        f"/repos/{REPO}/releases",
        body={
            "tag_name": VERSION,
            "name": f"e2e prime tester cc {VERSION}",
            "body": body,
            "draft": False,
            "prerelease": False,
        },
    )
    if status not in (200, 201):
        print(f"failed to create release: {status} {created}", file=sys.stderr)
        sys.exit(1)
    print(f"created GitHub release {VERSION} (id {created['id']})")
    return created


def upload_asset(release, archive):
    if archive is None:
        print("no artifact to upload -- skipping asset upload")
        return
    for asset in release.get("assets", []):
        if asset["name"] == archive.name:
            print(f"asset {archive.name} already attached to the release -- skipping upload")
            return
    upload_url = release["upload_url"].split("{")[0]
    data = archive.read_bytes()
    status, result = api(
        "POST",
        f"{upload_url}?name={archive.name}",
        raw=data,
        extra_headers={"Content-Type": "application/zip"},
    )
    if status not in (200, 201):
        print(f"failed to upload asset: {status} {result}", file=sys.stderr)
        sys.exit(1)
    print(f"uploaded {archive.name} to release {VERSION}")


def main():
    print(f"== releasing {VERSION} for {REPO} ==")
    ensure_tag()
    build_dir = build()
    archive = package_artifact(build_dir)
    release = ensure_release()
    upload_asset(release, archive)
    print("== done ==")


if __name__ == "__main__":
    main()
