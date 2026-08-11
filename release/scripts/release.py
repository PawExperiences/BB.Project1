#!/usr/bin/env python3
'''Automated release script for factorlib.

Builds the sdist+wheel, tags the release, pushes the tag, and creates
(or reuses) the corresponding GitHub release with the built artifacts
attached. Idempotent: safe to re-run if a previous step already
completed.

Run from the repository root:
    python release/scripts/release.py
'''
import shutil
import subprocess
import sys
from pathlib import Path

VERSION = '0.1.0'
TAG = 'v' + VERSION
TITLE = 'e2e gate check 0.1.0'
REPO_ROOT = Path(__file__).resolve().parents[2]
DIST_DIR = REPO_ROOT / 'dist'
NOTES_CANDIDATES = [REPO_ROOT / 'RELEASE_NOTES.md', REPO_ROOT / 'CHANGELOG.md']


def run(cmd):
    print('+ ' + ' '.join(cmd))
    subprocess.run(cmd, check=True, cwd=REPO_ROOT)


def run_ok(cmd):
    print('+ ' + ' '.join(cmd))
    return subprocess.run(cmd, cwd=REPO_ROOT).returncode == 0


def main():
    print('== Releasing factorlib ' + VERSION + ' ==')

    print('-- Building distribution artifacts --')
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'build'])
    run([sys.executable, '-m', 'build'])
    artifacts = sorted(DIST_DIR.glob('*')) if DIST_DIR.exists() else []
    if not artifacts:
        print('ERROR: no artifacts produced in dist/', file=sys.stderr)
        sys.exit(1)
    for a in artifacts:
        print('  built: ' + str(a))

    print('-- Tagging release --')
    existing = subprocess.run(
        ['git', 'tag', '--list', TAG],
        cwd=REPO_ROOT, capture_output=True, text=True, check=True,
    ).stdout.strip()
    if existing == TAG:
        print('  tag ' + TAG + ' already exists locally, skipping tag creation')
    else:
        run(['git', 'tag', '-a', TAG, '-m', TITLE])

    print('-- Pushing tag --')
    run(['git', 'push', 'origin', TAG])

    print('-- Creating GitHub release --')
    if run_ok(['gh', 'release', 'view', TAG]):
        print('  release ' + TAG + ' already exists on GitHub, skipping creation')
    else:
        notes_file = next((p for p in NOTES_CANDIDATES if p.exists()), None)
        cmd = ['gh', 'release', 'create', TAG]
        cmd += [str(a) for a in artifacts]
        cmd += ['--title', TITLE]
        if notes_file is not None:
            cmd += ['--notes-file', str(notes_file)]
        else:
            cmd += ['--notes', 'Release ' + TITLE]
        run(cmd)

    print('== Done: ' + TAG + ' released ==')


if __name__ == '__main__':
    main()
