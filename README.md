# mdpdf

A small, dependency-free Python command-line tool that converts a subset of
Markdown into a single, self-contained HTML document styled for printing
(for example, via a browser's Print-to-PDF).

## Supported markdown

- ATX headings: `#`, `##`, `###` (rendered as `<h1>`-`<h3>`)
- Paragraphs (blank-line separated text)
- **Bold** and *italic* emphasis
- Inline `code`
- Fenced code blocks (` ``` `)
- Unordered lists (`-`, `*`, `+`) and ordered lists (`1.`, `2.`, ...)
- Links: `[text](url)`

## Installation

Requires Python 3.8+. No runtime dependencies.

```sh
pip install -e .
```

This installs the `mdpdf` console script on your `PATH`.

## Usage

Write the HTML to a file:

```sh
mdpdf IN.md -o OUT.html
```

Write the HTML to stdout:

```sh
mdpdf IN.md
```

Open `OUT.html` in a browser and use Print (Ctrl/Cmd+P) → Save as PDF to
produce a PDF.

If `IN.md` does not exist, `mdpdf` exits with status code 2 and prints an
error naming the missing path.

## Producing a PDF

`mdpdf` generates HTML, not PDF, directly. To get a PDF, use a browser's
built-in print-to-PDF feature on the generated, `print.css`-styled HTML:

1. Generate the HTML: `mdpdf IN.md -o OUT.html`.
2. Open `OUT.html` in a browser.
3. Open the print dialog (Ctrl/Cmd+P).
4. Choose "Save as PDF" (or "Microsoft Print to PDF" on Windows) as the
   destination and save.

The page geometry, typography, and code styling in the PDF come from
`src/mdpdf/print.css`, which the generated HTML links for this purpose. See
`sample.md` for a document that exercises the full set of supported
Markdown constructs and can be used to preview the stylesheet.
