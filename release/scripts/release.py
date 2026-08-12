#!/usr/bin/env python3
# Cut and publish the release: tag the commit, push the tag, publish the GitHub release.
import os
import subprocess
import sys

VERSION = os.environ.get('RELEASE_VERSION', '0.1.0')
TAG = 'v' + VERSION
BRANCH = os.environ.get('RELEASE_BRANCH', 'main')
NOTES_PATH = os.environ.get('RELEASE_NOTES_PATH', os.path.join('release', 'RELEASE_NOTES.md'))


def run(cmd):
    print('+ ' + ' '.join(cmd))
    subprocess.run(cmd, check=True)


def capture(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return result.stdout.strip()


def tag_exists_locally(tag):
    result = subprocess.run(['git', 'rev-parse', '-q', '--verify', 'refs/tags/' + tag], capture_output=True)
    return result.returncode == 0


def tag_exists_remotely(tag):
    return bool(capture(['git', 'ls-remote', '--tags', 'origin', tag]))


def release_exists(tag):
    result = subprocess.run(['gh', 'release', 'view', tag], capture_output=True)
    return result.returncode == 0


def main():
    print('Releasing ' + TAG + ' from branch ' + BRANCH)

    if not os.path.isfile(NOTES_PATH):
        print('Release notes file not found at ' + NOTES_PATH + '.', file=sys.stderr)
        sys.exit(1)

    if capture(['git', 'status', '--porcelain']):
        print('Working tree is not clean. Commit or stash changes before releasing.', file=sys.stderr)
        sys.exit(1)

    current_branch = capture(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
    if current_branch != BRANCH:
        print('Expected to be on ' + BRANCH + ', but on ' + current_branch + '.', file=sys.stderr)
        sys.exit(1)

    if tag_exists_locally(TAG):
        print('Tag ' + TAG + ' already exists locally, skipping tag creation.')
    else:
        run(['git', 'tag', '-a', TAG, '-m', 'Release ' + TAG])

    if tag_exists_remotely(TAG):
        print('Tag ' + TAG + ' already exists on origin, skipping push.')
    else:
        run(['git', 'push', 'origin', TAG])

    if release_exists(TAG):
        print('GitHub release ' + TAG + ' already exists, skipping creation.')
    else:
        run(['gh', 'release', 'create', TAG, '--title', TAG, '--notes-file', NOTES_PATH])

    print('Release ' + TAG + ' complete.')


if __name__ == '__main__':
    main()
