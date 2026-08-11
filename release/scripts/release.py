#!/usr/bin/env python3
# Automated release script for wordcount v0.1.0.
# Runs the verification suite, cross-builds release binaries, tags the
# repo, and publishes a GitHub release with the changelog notes.
# Run from the repository root after all release checks pass.
# Idempotent: safe to re-run; skips steps that are already done.
import os
import shutil
import subprocess
import sys

VERSION = '0.1.0'
TAG = 'v' + VERSION
MODULE = 'wordcount'
DIST_DIR = 'dist'
NOTES_FILE = os.path.join('release', 'RELEASE_NOTES.md')

TARGETS = [
    ('linux', 'amd64'),
    ('darwin', 'amd64'),
    ('darwin', 'arm64'),
    ('windows', 'amd64'),
]


def run(cmd, **kwargs):
    print('+ ' + ' '.join(cmd))
    subprocess.run(cmd, check=True, **kwargs)


def tag_exists(tag):
    result = subprocess.run(
        ['git', 'rev-parse', '-q', '--verify', 'refs/tags/' + tag],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return result.returncode == 0


def main():
    if shutil.which('go') is None:
        print('error: go toolchain not found on PATH', file=sys.stderr)
        sys.exit(1)
    if shutil.which('git') is None:
        print('error: git not found on PATH', file=sys.stderr)
        sys.exit(1)

    print('== running verification suite ==')
    run(['go', 'build', './...'])
    run(['go', 'vet', './...'])
    run(['go', 'test', './...'])

    fmt = subprocess.run(['gofmt', '-l', '.'], stdout=subprocess.PIPE, text=True)
    if fmt.stdout.strip():
        print('error: gofmt reports unformatted files:\n' + fmt.stdout, file=sys.stderr)
        sys.exit(1)

    print('== building release binaries ==')
    os.makedirs(DIST_DIR, exist_ok=True)
    for goos, goarch in TARGETS:
        ext = '.exe' if goos == 'windows' else ''
        out = os.path.join(DIST_DIR, '%s-%s-%s-%s%s' % (MODULE, VERSION, goos, goarch, ext))
        env = os.environ.copy()
        env['GOOS'] = goos
        env['GOARCH'] = goarch
        env['CGO_ENABLED'] = '0'
        run(['go', 'build', '-o', out, '.'], env=env)
        print('built ' + out)

    print('== tagging release ==')
    if tag_exists(TAG):
        print(TAG + ' already exists locally, skipping tag creation')
    else:
        run(['git', 'tag', '-a', TAG, '-m', 'Release ' + TAG])
    run(['git', 'push', 'origin', TAG])

    print('== publishing GitHub release ==')
    if shutil.which('gh') is None:
        print('gh CLI not found; skipping automated publish.')
        print(
            'Publish manually: create a GitHub release for '
            + TAG
            + ' using '
            + NOTES_FILE
            + ' as the body and upload files from '
            + DIST_DIR
        )
        return

    exists = subprocess.run(
        ['gh', 'release', 'view', TAG], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    if exists.returncode == 0:
        print(TAG + ' release already exists on GitHub, skipping create')
    else:
        artifacts = [os.path.join(DIST_DIR, f) for f in sorted(os.listdir(DIST_DIR))]
        run(['gh', 'release', 'create', TAG] + artifacts + ['--title', TAG, '--notes-file', NOTES_FILE])

    print('release ' + TAG + ' complete')


if __name__ == '__main__':
    main()
