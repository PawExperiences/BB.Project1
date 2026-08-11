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
