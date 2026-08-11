## 0.1.0 -- e2e md to pdf 0.1.0

## [0.1.0] - 2026-08-11

### Added
- `mdpdf` command-line tool: converts a constrained Markdown subset into a single, print-ready HTML document (`pyproject.toml`, `src/mdpdf/__init__.py`, `src/mdpdf/cli.py`). `mdpdf IN.md -o OUT.html` writes a file; `mdpdf IN.md` (no `-o`) writes the document to stdout; `mdpdf MISSING.md` exits with status 2 and names the missing path.
- Core Markdown parsing layer: `src/mdpdf/inline.py` (plain text, bold, italic, inline code, links) and `src/mdpdf/blocks.py` (ATX headings, paragraphs, unordered/ordered list items, fenced code blocks with optional language tag), producing a typed representation that `cli.py` renders to HTML. Text inside fenced code blocks is preserved verbatim; `&`, `<`, `>` in ordinary text are entity-escaped.
- Print stylesheet `src/mdpdf/print.css`: `@page` sized for A4 with margins, 11pt serif body text, monospace code on a light background, and `page-break-after: avoid` on heading elements.
- `sample.md` fixture at the repo root exercising the supported Markdown syntax, used to visually verify the HTML/CSS output end-to-end.
- `README.md`: install instructions, both CLI invocation forms, and a section on producing a PDF via a browser's "Print to PDF" feature.
- Test suite: `tests/test_inline.py`, `tests/test_blocks.py`.

### Changed
- N/A (initial release).

### Fixed
- N/A (initial release).
