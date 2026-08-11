import os
import shutil
import subprocess
import sys
import tempfile
import venv
from pathlib import Path

VERSION = '0.1.0'
TAG = 'v0.1.0'
BRANCH = 'main'

RELEASE_NOTES = '''# mdpdf 0.1.0

mdpdf converts a constrained Markdown subset into a single, print-ready HTML
document, so you can produce a clean PDF using nothing more than your
browser's Print dialog. This is the first release: the CLI, the parser, and
a print-tuned stylesheet ship together as one installable package.

## Highlights
- New mdpdf CLI: `mdpdf IN.md -o OUT.html` writes a file, `mdpdf IN.md` writes to stdout
- Headings, paragraphs, bold/italic, inline code, fenced code blocks, links, and ordered/unordered lists
- Dedicated inline.py / blocks.py parser modules producing a typed, reusable representation
- Print CSS tuned for A4: serif 11pt body, monospace code on a light background, headings never orphaned at a page break
- sample.md fixture plus README docs on producing a PDF via a browser's Print to PDF
- A missing input file fails fast with exit code 2 and names the missing path

## Install
    pip install dist/mdpdf-0.1.0-py3-none-any.whl
or from source:
    pip install .

## Usage
    mdpdf report.md -o report.html
    (open report.html in a browser, then Print > Save as PDF)
'''


def run(cmd):
    print('-> ' + ' '.join(cmd))
    subprocess.run(cmd, check=True)


def main():
    print('== mdpdf release {} =='.format(VERSION))

    run(['git', 'fetch', '--quiet', 'origin', BRANCH, '--tags'])
    run(['git', 'checkout', '--quiet', BRANCH])
    run(['git', 'pull', '--quiet', 'origin', BRANCH])
    status = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, check=True)
    if status.stdout.strip():
        print('ERROR: working tree is not clean. Commit or stash changes first.', file=sys.stderr)
        sys.exit(1)

    run([sys.executable, '-m', 'pip', 'install', '--quiet', '--upgrade', 'pip'])
    run([sys.executable, '-m', 'pip', 'install', '--quiet', '-e', '.'])
    run([sys.executable, '-m', 'pip', 'install', '--quiet', 'pytest', 'build'])

    run([sys.executable, '-m', 'pytest', 'tests/', '-q'])

    for path in ('dist', 'build'):
        shutil.rmtree(path, ignore_errors=True)
    run([sys.executable, '-m', 'build'])

    with tempfile.TemporaryDirectory() as smoke_dir:
        venv_dir = Path(smoke_dir) / 'venv'
        venv.create(venv_dir, with_pip=True)
        if os.name == 'nt':
            pip_bin = venv_dir / 'Scripts' / 'pip.exe'
            mdpdf_bin = venv_dir / 'Scripts' / 'mdpdf.exe'
        else:
            pip_bin = venv_dir / 'bin' / 'pip'
            mdpdf_bin = venv_dir / 'bin' / 'mdpdf'
        wheel = sorted(Path('dist').glob('*.whl'))[-1]
        run([str(pip_bin), 'install', '--quiet', str(wheel)])
        out_html = Path(smoke_dir) / 'sample.html'
        run([str(mdpdf_bin), 'sample.md', '-o', str(out_html)])
        if not out_html.exists() or out_html.stat().st_size == 0:
            print('ERROR: smoke test did not produce output HTML', file=sys.stderr)
            sys.exit(1)
        missing = subprocess.run([str(mdpdf_bin), 'does-not-exist.md'], capture_output=True)
        if missing.returncode != 2:
            print('ERROR: expected exit code 2 for missing input, got {}'.format(missing.returncode), file=sys.stderr)
            sys.exit(1)
        print('-> Smoke test passed')

    existing = subprocess.run(['git', 'tag', '--list', TAG], capture_output=True, text=True, check=True).stdout.strip()
    if existing:
        print('Tag {} already exists locally, skipping tag creation'.format(TAG))
    else:
        run(['git', 'tag', '-a', TAG, '-m', 'Release mdpdf {}'.format(VERSION)])
    run(['git', 'push', 'origin', TAG])

    gh = shutil.which('gh')
    if gh:
        with tempfile.NamedTemporaryFile('w', suffix='.md', delete=False) as f:
            f.write(RELEASE_NOTES)
            notes_path = f.name
        view = subprocess.run([gh, 'release', 'view', TAG], capture_output=True)
        if view.returncode == 0:
            run([gh, 'release', 'edit', TAG, '--title', 'mdpdf {}'.format(VERSION), '--notes-file', notes_path])
        else:
            run([gh, 'release', 'create', TAG, '--title', 'mdpdf {}'.format(VERSION), '--notes-file', notes_path])
        assets = [str(p) for p in Path('dist').glob('*') if p.suffix == '.whl' or p.name.endswith('.tar.gz')]
        if assets:
            run([gh, 'release', 'upload', TAG] + assets + ['--clobber'])
        os.remove(notes_path)
    else:
        print('WARNING: gh CLI not found. Publish the release manually using the files in dist/.', file=sys.stderr)

    print('== Release {} complete =='.format(VERSION))


if __name__ == '__main__':
    main()
