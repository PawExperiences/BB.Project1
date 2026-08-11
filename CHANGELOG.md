## 0.1.0 -- e2e md to pdf 0.1.0

# Changelog

## [0.1.0] - 2026-08-11

### Added
- `mdpdf` command-line tool: a dependency-free Python package that converts a supported subset of Markdown into a single, self-contained, print-styled HTML document (`mdpdf IN.md -o OUT.html`, or stdout via `mdpdf IN.md`).
- Markdown inline parser (`src/mdpdf/inline.py`, `render_inline`): bold (`**text**`/`__text__`), italic (`*text*`/`_text_`), inline code (`` `code` ``, not itself inline-parsed), and `[text](url)` links, with HTML-escaping of stray `&`, `<`, `>`.
- Markdown block parser (`src/mdpdf/blocks.py`, `render_blocks`): ATX headings, paragraphs, unordered (`-`/`*`/`+`) and ordered (`1.`) lists, and fenced code blocks (content emitted verbatim, not inline-parsed, HTML-escaped).
- Print stylesheet (`src/mdpdf/print.css`): `@page` sized for A4 with 2cm margins, an 11pt serif body, monospace code on a light (`#f5f5f5`) background, and `page-break-after: avoid` on heading levels so headings aren't orphaned when printed.
- `sample.md`: a demonstration document exercising the supported constructs, used to visually smoke-test `print.css` and the pipeline end-to-end.
- `README.md`: install instructions, both CLI usage forms (file output and stdout), and a section on producing a PDF via a browser's Print -> Save as PDF using `print.css`.
- `pyproject.toml`: packages the tool as `mdpdf` 0.1.0 with a `[project.scripts]` entry so `mdpdf` is on PATH after install.

### Changed
- N/A - initial release.

### Fixed
- N/A - initial release.

> Note: the "Markdown to printable HTML" card's narrative describes ATX headings as h1-h3 only, while the block-parser AC and the print-stylesheet/sample.md AC require h1-h6. This changelog intentionally does not assert a heading depth beyond "ATX headings" until a human confirms actual `mdpdf` output against one of the conflicting cards (see docsUpdates/summary).
