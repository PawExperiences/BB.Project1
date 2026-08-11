#!/usr/bin/env python3
# Automated release script for the units package (e2e unit converter 0.1.0).
import os
import shutil
import subprocess
import sys
from pathlib import Path

VERSION = os.environ.get('RELEASE_VERSION', '0.1.0')
TAG = os.environ.get('RELEASE_TAG', 'v' + VERSION)
REMOTE = os.environ.get('RELEASE_REMOTE', 'origin')
BRANCH = os.environ.get('RELEASE_BRANCH', 'main')
REPO_ROOT = Path(__file__).resolve().parents[2]


def run(cmd):
    print('==> ' + ' '.join(cmd))
    subprocess.run(cmd, cwd=REPO_ROOT, check=True)


def tool_available(name):
    return shutil.which(name) is not None


print('-- Running test suite (python -m pytest) --')
run([sys.executable, '-m', 'pytest', '-q'])

print('-- Running ruff lint and format checks --')
run(['ruff', 'check', 'src', 'tests'])
run(['ruff', 'format', '--check', 'src', 'tests'])

print('-- Verifying shipped unit tables match the resolved metric-only spec --')
sys.path.insert(0, str(REPO_ROOT / 'src'))
from units import LENGTH_FACTORS, MASS_FACTORS

EXPECTED_LENGTH = {'m', 'km', 'cm', 'mm'}
EXPECTED_MASS = {'g', 'kg', 'mg'}
if set(LENGTH_FACTORS) != EXPECTED_LENGTH or set(MASS_FACTORS) != EXPECTED_MASS:
    print('!! Unit table mismatch: this release bundle has two conflicting task specs')
    print('   (an earlier imperial unit list vs a later metric-only clarification).')
    print('   expected length=' + str(sorted(EXPECTED_LENGTH)) + ' mass=' + str(sorted(EXPECTED_MASS)))
    print('   found    length=' + str(sorted(LENGTH_FACTORS)) + ' mass=' + str(sorted(MASS_FACTORS)))
    print('   STOP and have a human confirm which unit set is meant to ship before releasing.')
    sys.exit(1)
print('   unit tables OK')

dist = REPO_ROOT / 'dist'
if tool_available('uv'):
    print('-- Building distribution artifacts (uv build) --')
    run(['uv', 'build'])
else:
    print('-- uv not found, building with python -m build --')
    run([sys.executable, '-m', 'build'])

artifacts = sorted(dist.glob('*' + VERSION + '*'))
if not artifacts:
    print('!! No build artifacts matching version ' + VERSION + ' found in ' + str(dist))
    sys.exit(1)
for a in artifacts:
    print('   built ' + str(a))

existing_tag = subprocess.run(['git', 'tag', '--list', TAG], cwd=REPO_ROOT, capture_output=True, text=True)
if existing_tag.stdout.strip():
    print('-- Tag ' + TAG + ' already exists locally, skipping tag creation --')
else:
    print('-- Creating annotated tag ' + TAG + ' --')
    run(['git', 'tag', '-a', TAG, '-m', 'e2e unit converter ' + VERSION])
    print('-- Pushing tag ' + TAG + ' to ' + REMOTE + ' --')
    run(['git', 'push', REMOTE, TAG])

if not tool_available('gh'):
    print('-- GitHub CLI (gh) not found; skipping release publish. --')
    print('   Install gh and re-run, or publish the release manually with the artifacts in dist/.')
else:
    existing_release = subprocess.run(['gh', 'release', 'view', TAG], cwd=REPO_ROOT, capture_output=True, text=True)
    if existing_release.returncode == 0:
        print('-- GitHub release ' + TAG + ' already exists, skipping creation --')
    else:
        notes_file = REPO_ROOT / 'release' / 'RELEASE_NOTES.md'
        cmd = ['gh', 'release', 'create', TAG] + [str(a) for a in artifacts]
        cmd += ['--title', 'e2e unit converter ' + VERSION, '--target', BRANCH]
        if notes_file.exists():
            cmd += ['--notes-file', str(notes_file)]
        else:
            cmd += ['--notes', 'e2e unit converter ' + VERSION]
        print('-- Creating GitHub release ' + TAG + ' --')
        run(cmd)

print('Release ' + TAG + ' complete.')
