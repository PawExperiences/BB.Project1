#!/usr/bin/env python3
# Performs the automated e2e link checker release steps: runs tests, builds
# the sdist/wheel, tags the repo, pushes the tag, and (if the gh CLI is
# available) publishes a GitHub Release with the built artifacts attached.
#
# When to run: after all bundled tasks for a release are merged to the
# release branch and the runbook's manual steps up to 'Tag the release'
# are complete.
#
# Usage: python release/scripts/release.py [version]
# Env (optional): RELEASE_BRANCH (default: main), RELEASE_NOTES_FILE

import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def run(cmd, **kwargs):
    print('+ ' + ' '.join(cmd))
    return subprocess.run(cmd, cwd=REPO_ROOT, check=True, **kwargs)


def capture(cmd):
    result = subprocess.run(cmd, cwd=REPO_ROOT, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def read_version():
    text = (REPO_ROOT / 'pyproject.toml').read_text(encoding='utf-8')
    marker = 'version'
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(marker):
            parts = stripped.split('=', 1)
            if len(parts) == 2:
                value = parts[1].strip()
                value = value.strip(chr(34))
                return value
    print('error: could not find version in pyproject.toml', file=sys.stderr)
    sys.exit(2)


def main():
    version = sys.argv[1] if len(sys.argv) > 1 else read_version()
    tag = 'v' + version
    branch = os.environ.get('RELEASE_BRANCH', 'main')

    current_branch = capture(['git', 'branch', '--show-current'])
    if current_branch != branch:
        print('error: on branch ' + current_branch + ', expected ' + branch, file=sys.stderr)
        sys.exit(2)

    status = capture(['git', 'status', '--porcelain'])
    if status:
        print('error: working tree is not clean', file=sys.stderr)
        print(status, file=sys.stderr)
        sys.exit(2)

    print('== Running test suite ==')
    run([sys.executable, '-m', 'pytest'])

    print('== Building distribution artifacts ==')
    try:
        import build  # noqa: F401
    except ImportError:
        run([sys.executable, '-m', 'pip', 'install', '--upgrade', 'build'])
    dist_dir = REPO_ROOT / 'dist'
    run([sys.executable, '-m', 'build'])
    artifacts = sorted(dist_dir.glob('*' + version + '*'))
    if not artifacts:
        print('error: no dist artifacts found for version ' + version, file=sys.stderr)
        sys.exit(2)
    for artifact in artifacts:
        print('built: ' + str(artifact))

    print('== Tagging release ' + tag + ' ==')
    existing_tags = capture(['git', 'tag', '-l', tag])
    if tag in existing_tags.splitlines():
        print('tag ' + tag + ' already exists locally, skipping tag creation')
    else:
        run(['git', 'tag', '-a', tag, '-m', 'e2e link checker ' + version])

    print('== Pushing tag ' + tag + ' to origin ==')
    run(['git', 'push', 'origin', tag])

    gh = shutil.which('gh')
    if gh is None:
        print('note: gh CLI not found; skipping GitHub Release creation.', file=sys.stderr)
        print('Create the release manually and attach the files in dist/.', file=sys.stderr)
        return

    notes_file = os.environ.get('RELEASE_NOTES_FILE')
    if not notes_file:
        default_notes = REPO_ROOT / 'release' / 'RELEASE_NOTES.md'
        notes_file = str(default_notes) if default_notes.exists() else None

    existing = subprocess.run([gh, 'release', 'view', tag], cwd=REPO_ROOT, capture_output=True, text=True)
    if existing.returncode == 0:
        print('GitHub release ' + tag + ' already exists, skipping creation')
        return

    print('== Creating GitHub Release ' + tag + ' ==')
    cmd = [gh, 'release', 'create', tag]
    cmd += [str(a) for a in artifacts]
    cmd += ['--title', 'e2e link checker ' + version]
    if notes_file:
        cmd += ['--notes-file', notes_file]
    else:
        cmd += ['--generate-notes']
    run(cmd)
    print('Release ' + tag + ' published.')


if __name__ == '__main__':
    main()
