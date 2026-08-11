"""Command-line interface: render a Markdown file as a print-ready HTML document."""

import argparse
import sys
from pathlib import Path
from typing import List, Optional, Sequence

from .blocks import BlockElement, CodeBlock, Heading, ListItem, Paragraph, parse_blocks
from .inline import Bold, Code, InlineElement, Italic, Link, Text

_STYLE = """
@page {
  size: A4;
  margin: 2cm;
}

body {
  font-family: Georgia, "Times New Roman", Cambria, serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #111;
}

pre, code {
  font-family: "Courier New", Courier, monospace;
  background-color: #f5f5f5;
}

pre {
  padding: 0.75em;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

h1, h2, h3 {
  page-break-after: avoid;
}
"""


def escape(text: str) -> str:
    """Escape &, <, and > to their HTML entities."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def render_inline(elements: Sequence[InlineElement]) -> str:
    parts: List[str] = []
    for element in elements:
        if isinstance(element, Text):
            parts.append(escape(element.content))
        elif isinstance(element, Bold):
            parts.append(f"<strong>{escape(element.content)}</strong>")
        elif isinstance(element, Italic):
            parts.append(f"<em>{escape(element.content)}</em>")
        elif isinstance(element, Code):
            parts.append(f"<code>{escape(element.content)}</code>")
        elif isinstance(element, Link):
            parts.append(f'<a href="{escape(element.url)}">{escape(element.text)}</a>')
    return "".join(parts)


def render_blocks(blocks: Sequence[BlockElement]) -> str:
    parts: List[str] = []
    i = 0
    n = len(blocks)
    while i < n:
        block = blocks[i]

        if isinstance(block, Heading):
            parts.append(f"<h{block.level}>{render_inline(block.content)}</h{block.level}>")
            i += 1
            continue

        if isinstance(block, Paragraph):
            parts.append(f"<p>{render_inline(block.content)}</p>")
            i += 1
            continue

        if isinstance(block, CodeBlock):
            parts.append(f"<pre><code>{block.content}</code></pre>")
            i += 1
            continue

        if isinstance(block, ListItem):
            ordered = block.ordered
            items: List[str] = []
            while i < n and isinstance(blocks[i], ListItem) and blocks[i].ordered == ordered:
                items.append(f"<li>{render_inline(blocks[i].content)}</li>")
                i += 1
            tag = "ol" if ordered else "ul"
            parts.append(f"<{tag}>{''.join(items)}</{tag}>")
            continue

        i += 1

    return "\n".join(parts)


def render_document(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{escape(title)}</title>
<style>{_STYLE}</style>
</head>
<body>
{body}
</body>
</html>
"""


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="mdpdf",
        description="Convert a Markdown file into a single print-ready HTML document.",
    )
    parser.add_argument("input", help="Path to the input Markdown file")
    parser.add_argument(
        "-o", "--output", help="Path to write the HTML output (default: stdout)"
    )
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    if not input_path.is_file():
        print(f"mdpdf: error: input file not found: {args.input}", file=sys.stderr)
        return 2

    text = input_path.read_text(encoding="utf-8")
    blocks = parse_blocks(text)
    body = render_blocks(blocks)
    document = render_document(input_path.stem, body)

    if args.output:
        Path(args.output).write_text(document, encoding="utf-8")
    else:
        sys.stdout.write(document)

    return 0


if __name__ == "__main__":
    sys.exit(main())
