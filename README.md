# mdpdf

Convert a constrained Markdown subset into a single, print-ready HTML
document — one you can open in a browser and print or "Save as PDF" without
any browser plugin or heavyweight toolchain.

## Supported Markdown subset

- ATX headings, levels 1-3 (`#`, `##`, `###`)
- Paragraphs
- Bold (`**text**`) and italic (`*text*`) emphasis
- Inline code spans (`` `code` ``)
- Fenced code blocks (` ``` `)
- Unordered lists (`-`, `*`, `+`)
- Ordered lists (`1.`, `2.`, ...)
- Links (`[text](url)`)

The emitted HTML document embeds print CSS: an `@page` rule sized for A4
with margins, a serif 11pt body, monospace code on a light background, and
`page-break-after: avoid` on headings so they don't get orphaned at the
bottom of a printed page.

## Installation

```sh
pip install -e .
```

This installs the `mdpdf` console script on your `PATH`.

## Usage

Write the HTML document to a file:

```sh
mdpdf IN.md -o OUT.html
```

Write the HTML document to stdout:

```sh
mdpdf IN.md
```

If `IN.md` does not exist, `mdpdf` exits with status code 2 and prints an
error message naming the missing path.

## Printing to PDF

`mdpdf` only produces HTML — turning that HTML into a PDF is a manual step
done with a browser's built-in "Print to PDF" feature, using the print
stylesheet at `src/mdpdf/print.css` to control page size, fonts, and page
breaks:

1. Generate the HTML, e.g. `mdpdf sample.md -o sample.html`.
2. Make sure `src/mdpdf/print.css` is applied to the page — either paste
   its rules into a `<style>` block in the generated file's `<head>`, or
   add `<link rel="stylesheet" href="src/mdpdf/print.css">` pointing at it.
3. Open the HTML file in a browser.
4. Open the browser's print dialog (`Ctrl+P` / `Cmd+P`) and choose "Save as
   PDF" (or "Print to PDF") as the destination.
5. In the print preview you should see A4 pages with margins, 11pt serif
   body text, monospace code on a light background, and no heading left
   stranded alone at the bottom of a page — that layout comes from
   `print.css`.

`sample.md` at the repository root is a fixture containing one example of
every construct the parser supports, useful for checking this end-to-end.
