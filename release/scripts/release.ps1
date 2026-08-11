$ErrorActionPreference = 'Stop'

$Version = '0.1.0'
$Tag = 'v0.1.0'
$Branch = 'main'

Write-Host ('== mdpdf release {0} ==' -f $Version)

Write-Host '-> Fetching tags and checking working tree'
git fetch --quiet origin $Branch --tags
git checkout --quiet $Branch
git pull --quiet origin $Branch
$statusOutput = git status --porcelain
if ($statusOutput) {
    Write-Error 'Working tree is not clean. Commit or stash changes first.'
    exit 1
}

Write-Host '-> Installing dependencies'
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -e .
python -m pip install --quiet pytest build

Write-Host '-> Running test suite'
python -m pytest tests/ -q

Write-Host '-> Building sdist and wheel'
if (Test-Path dist) { Remove-Item -Recurse -Force dist }
if (Test-Path build) { Remove-Item -Recurse -Force build }
python -m build

Write-Host '-> Smoke-testing built wheel in a temporary venv'
$SmokeDir = Join-Path $env:TEMP ('mdpdf-smoke-' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Force -Path $SmokeDir | Out-Null
python -m venv (Join-Path $SmokeDir 'venv')
$VenvDir = Join-Path $SmokeDir 'venv'
$ScriptsDir = Join-Path $VenvDir 'Scripts'
$PipBin = Join-Path $ScriptsDir 'pip.exe'
$MdpdfBin = Join-Path $ScriptsDir 'mdpdf.exe'
$Wheel = Get-ChildItem dist/*.whl | Select-Object -First 1
& $PipBin install --quiet $Wheel.FullName
$OutHtml = Join-Path $SmokeDir 'sample.html'
& $MdpdfBin sample.md -o $OutHtml
if (-not (Test-Path $OutHtml) -or (Get-Item $OutHtml).Length -eq 0) {
    Write-Error 'Smoke test did not produce output HTML'
    exit 1
}
& $MdpdfBin does-not-exist.md 2>$null
$MissingStatus = $LASTEXITCODE
if ($MissingStatus -ne 2) {
    Write-Error ('Expected exit code 2 for missing input, got {0}' -f $MissingStatus)
    exit 1
}
Remove-Item -Recurse -Force $SmokeDir -Confirm:$false
Write-Host '-> Smoke test passed'

Write-Host '-> Tagging release'
$existingTag = git tag --list $Tag
if ($existingTag) {
    Write-Host ('Tag {0} already exists locally, skipping tag creation' -f $Tag)
} else {
    git tag -a $Tag -m ('Release mdpdf {0}' -f $Version)
}
git push origin $Tag

Write-Host '-> Publishing GitHub release'
$ghCmd = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCmd) {
    $NotesFile = Join-Path $env:TEMP ('mdpdf-notes-' + [guid]::NewGuid().ToString() + '.md')
    Set-Content -Path $NotesFile -Value @'
# mdpdf 0.1.0

mdpdf converts a constrained Markdown subset into a single, print-ready HTML
document, so you can produce a clean PDF using nothing more than your
browser's Print dialog. This is the first release: the CLI, the parser, and
a print-tuned stylesheet ship together as one installable package.

## Highlights
- New mdpdf CLI: mdpdf IN.md -o OUT.html writes a file, mdpdf IN.md writes to stdout
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
'@
    gh release view $Tag *> $null
    if ($LASTEXITCODE -eq 0) {
        gh release edit $Tag --title ('mdpdf {0}' -f $Version) --notes-file $NotesFile
    } else {
        gh release create $Tag --title ('mdpdf {0}' -f $Version) --notes-file $NotesFile
    }
    $Assets = Get-ChildItem dist/* | Where-Object { $_.Extension -eq '.whl' -or $_.Name -like '*.tar.gz' }
    gh release upload $Tag $Assets.FullName --clobber
    Remove-Item -Force $NotesFile
} else {
    Write-Warning 'gh CLI not found. Publish the release manually using the files in dist/.'
}

Write-Host ('== Release {0} complete ==' -f $Version)
