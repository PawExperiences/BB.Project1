"""Command-line tool that converts a Markdown subset into a printable HTML document."""

import argparse
import html
import re
import sys

_HEADING_RE = re.compile(r'^(#{1,3}) (.*)$')
_UL_ITEM_RE = re.compile(r'^[-*+] (.*)$')
_OL_ITEM_RE = re.compile(r'^\d+\. (.*)$')
_FENCE_OPEN_RE = re.compile(r'^```(\S*)\s*$')
_FENCE_CLOSE_RE = re.compile(r'^```\s*$')

_INLINE_PATTERN = re.compile(
    r'`(?P<code>[^`]+)`'
    r'|\[(?P<link_text>[^\]]*)\]\((?P<link_url>[^)\s]+)\)'
    r'|\*\*(?P<bold1>[^*]+?)\*\*'
    r'|__(?P<bold2>[^_]+?)__'
    r'|\*(?P<italic1>[^*]+?)\*'
    r'|_(?P<italic2>[^_]+?)_'
)


def _escape(text):
    return html.escape(text, quote=False)


def _render_inline_match(match):
    if match.group('code') is not None:
        return '<code>{}</code>'.format(_escape(match.group('code')))
    if match.group('link_text') is not None:
        link_text = _escape(match.group('link_text'))
        link_url = html.escape(match.group('link_url'), quote=True)
        return '<a href="{}">{}</a>'.format(link_url, link_text)
    if match.group('bold1') is not None:
        return '<strong>{}</strong>'.format(_escape(match.group('bold1')))
    if match.group('bold2') is not None:
        return '<strong>{}</strong>'.format(_escape(match.group('bold2')))
    if match.group('italic1') is not None:
        return '<em>{}</em>'.format(_escape(match.group('italic1')))
    return '<em>{}</em>'.format(_escape(match.group('italic2')))


def render_inline(text):
    """Render inline markdown (bold, italic, inline code, links) to HTML, escaping plain text."""
    pieces = []
    pos = 0
    for match in _INLINE_PATTERN.finditer(text):
        pieces.append(_escape(text[pos:match.start()]))
        pieces.append(_render_inline_match(match))
        pos = match.end()
    pieces.append(_escape(text[pos:]))
    return ''.join(pieces)


def render_body(markdown_text):
    """Render the supported markdown subset (headings, paragraphs, lists, fenced code) to HTML."""
    lines = markdown_text.split('\n')
    html_parts = []
    paragraph_lines = []

    def flush_paragraph():
        if paragraph_lines:
            text = ' '.join(paragraph_lines)
            html_parts.append('<p>{}</p>'.format(render_inline(text)))
            paragraph_lines.clear()

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]

        if line.strip() == '':
            flush_paragraph()
            i += 1
            continue

        if _FENCE_OPEN_RE.match(line):
            flush_paragraph()
            i += 1
            code_lines = []
            while i < n and not _FENCE_CLOSE_RE.match(lines[i]):
                code_lines.append(lines[i])
                i += 1
            if i < n:
                i += 1
            content = '\n'.join(code_lines)
            html_parts.append('<pre><code>{}</code></pre>'.format(content))
            continue

        heading_match = _HEADING_RE.match(line)
        if heading_match:
            flush_paragraph()
            level = len(heading_match.group(1))
            html_parts.append(
                '<h{0}>{1}</h{0}>'.format(level, render_inline(heading_match.group(2)))
            )
            i += 1
            continue

        if _UL_ITEM_RE.match(line):
            flush_paragraph()
            items = []
            while i < n:
                item_match = _UL_ITEM_RE.match(lines[i])
                if not item_match:
                    break
                items.append(item_match.group(1))
                i += 1
            items_html = ''.join('<li>{}</li>'.format(render_inline(item)) for item in items)
            html_parts.append('<ul>{}</ul>'.format(items_html))
            continue

        if _OL_ITEM_RE.match(line):
            flush_paragraph()
            items = []
            while i < n:
                item_match = _OL_ITEM_RE.match(lines[i])
                if not item_match:
                    break
                items.append(item_match.group(1))
                i += 1
            items_html = ''.join('<li>{}</li>'.format(render_inline(item)) for item in items)
            html_parts.append('<ol>{}</ol>'.format(items_html))
            continue

        paragraph_lines.append(line.strip())
        i += 1

    flush_paragraph()
    return '\n'.join(html_parts)


_STYLE = """
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
    }
    h1, h2, h3 {
      font-family: Georgia, 'Times New Roman', serif;
      page-break-after: avoid;
    }
    code, pre {
      font-family: 'Courier New', Consolas, monospace;
      background-color: #f5f5f5;
    }
    code {
      padding: 0.1em 0.3em;
      border-radius: 3px;
    }
    pre {
      padding: 0.75em;
      overflow-x: auto;
      border-radius: 3px;
    }
    pre code {
      padding: 0;
      background-color: transparent;
    }
"""


def render_document(markdown_text, title='Document'):
    """Wrap the rendered markdown body in a complete, print-styled HTML document."""
    body = render_body(markdown_text)
    return (
        '<!DOCTYPE html>\n'
        '<html lang="en">\n'
        '<head>\n'
        '<meta charset="utf-8">\n'
        '<title>{title}</title>\n'
        '<style>{style}</style>\n'
        '</head>\n'
        '<body>\n'
        '{body}\n'
        '</body>\n'
        '</html>\n'
    ).format(title=_escape(title), style=_STYLE, body=body)


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog='mdpdf',
        description='Convert a Markdown file into a self-contained, print-ready HTML document.',
    )
    parser.add_argument('input', metavar='IN.md', help='path to the input markdown file')
    parser.add_argument(
        '-o', '--output', metavar='OUT.html', default=None,
        help='path to write the HTML output to (defaults to stdout)',
    )
    args = parser.parse_args(argv)

    try:
        with open(args.input, 'r', encoding='utf-8') as f:
            markdown_text = f.read()
    except FileNotFoundError:
        print('mdpdf: error: input file not found: {}'.format(args.input), file=sys.stderr)
        return 2

    document = render_document(markdown_text, title=args.input)

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(document)
    else:
        sys.stdout.write(document)

    return 0


if __name__ == '__main__':
    sys.exit(main())
