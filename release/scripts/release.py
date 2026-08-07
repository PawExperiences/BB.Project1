#!/usr/bin/env python3
"""release.py -- tag, push, create GitHub Release draft, upload artifact.
Run after CI is green and the build artifact exists.
Required env vars: GITHUB_TOKEN, GITHUB_REPO (owner/repo), RELEASE_VERSION, ARTIFACT_PATH."""
import os, subprocess, sys, json, urllib.request, urllib.error

def env(key):
    val = os.environ.get(key, '').strip()
    if not val:
        print(f'ERROR: environment variable {key} is not set.', file=sys.stderr)
        sys.exit(1)
    return val

TOKEN   = env('GITHUB_TOKEN')
REPO    = env('GITHUB_REPO')
VERSION = env('RELEASE_VERSION')
ARTIFACT= env('ARTIFACT_PATH')
TAG     = f'v{VERSION}'
API     = 'https://api.github.com'

def gh_request(method, url, data=None, content_type='application/json', extra_headers=None):
    body = json.dumps(data).encode() if data is not None else None
    headers = {
        'Authorization': f'token {TOKEN}',
        'Accept': 'application/vnd.github+json',
        'Content-Type': content_type,
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors='replace')
        print(f'HTTP {e.code} {method} {url}: {body}', file=sys.stderr)
        sys.exit(1)

# 1. Create tag
print(f'[release.py] Creating annotated tag {TAG} ...')
result = subprocess.run(['git', 'tag', '-a', TAG, '-m', f'Release {TAG}'], capture_output=True, text=True)
if result.returncode != 0:
    if 'already exists' in result.stderr:
        print(f'[release.py] Tag {TAG} already exists, skipping tag creation.')
    else:
        print(result.stderr, file=sys.stderr); sys.exit(1)
else:
    print(f'[release.py] Tag {TAG} created.')

# 2. Push tag
print(f'[release.py] Pushing tag {TAG} to origin ...')
result = subprocess.run(['git', 'push', 'origin', TAG], capture_output=True, text=True)
if result.returncode != 0 and 'already exists' not in result.stderr:
    print(result.stderr, file=sys.stderr); sys.exit(1)
print(f'[release.py] Tag pushed.')

# 3. Create GitHub Release draft
CHANGELOG_BODY = (
    '## e2e prime tester 0.3.0 -- Initial Release\n\n'
    '### Added\n'
    '- `prime_tester` C++17 console app: trial-division primality test with 6k\u00b11 optimisation.\n'
    '- Dual input mode: argv tokens or stdin line-by-line.\n'
    '- Robust error handling: invalid tokens to stderr; exit code 1 on any error.\n'
    '- `README.md` with build instructions and 8-case worked-examples table.\n'
    '- `CHANGELOG.md`, `CONTRIBUTING.md`, `RELEASING.md` added.\n'
    '- CI workflow updated for C++17/CMake build.\n'
    '- Release and run helper scripts (Python / sh / PowerShell).\n'
)
print(f'[release.py] Creating GitHub Release draft for {TAG} ...')
rel = gh_request('POST', f'{API}/repos/{REPO}/releases', {
    'tag_name': TAG, 'name': f'e2e prime tester {VERSION}',
    'body': CHANGELOG_BODY, 'draft': True, 'prerelease': False
})
rel_id    = rel['id']
upload_url= rel['upload_url'].split('{')[0]
print(f'[release.py] Draft release created: id={rel_id}')

# 4. Upload artifact
if not os.path.isfile(ARTIFACT):
    print(f'ERROR: artifact not found at {ARTIFACT}', file=sys.stderr); sys.exit(1)
artifact_name = os.path.basename(ARTIFACT)
print(f'[release.py] Uploading artifact {artifact_name} ...')
with open(ARTIFACT, 'rb') as f:
    artifact_bytes = f.read()
gh_request(
    'POST',
    f'{upload_url}?name={artifact_name}',
    data=None,
    content_type='application/octet-stream',
    extra_headers={'Content-Length': str(len(artifact_bytes))}
)
print(f'[release.py] Artifact uploaded.')
print(f'[release.py] Done. Review and publish the draft at: https://github.com/{REPO}/releases')
