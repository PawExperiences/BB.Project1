import html
import re

from .inline import render_inline

_HEADING_RE = re.compile(r'^(#{1,6}) (.*)$')
_UL_ITEM_RE = re.compile(r'^[-*+] (.*)$')
_OL_ITEM_RE = re.compile(r'^\d+\. (.*)$')
_FENCE_OPEN_RE = re.compile(r'^```(\S*)\s*$')
_FENCE_CLOSE_RE = re.compile(r'^```\s*$')


def render_blocks(markdown_text: str) -> str:
    lines = markdown_text.split('\n')
    html_parts = []
    paragraph_lines = []

    def flush_paragraph():
        if paragraph_lines:
            text = ' '.join(paragraph_lines)
            html_parts.append(f'<p>{render_inline(text)}</p>')
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
            content = html.escape('\n'.join(code_lines), quote=False)
            html_parts.append(f'<pre><code>{content}</code></pre>')
            continue

        heading_match = _HEADING_RE.match(line)
        if heading_match:
            flush_paragraph()
            level = len(heading_match.group(1))
            html_parts.append(
                f'<h{level}>{render_inline(heading_match.group(2))}</h{level}>'
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
            items_html = ''.join(f'<li>{render_inline(item)}</li>' for item in items)
            html_parts.append(f'<ul>{items_html}</ul>')
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
            items_html = ''.join(f'<li>{render_inline(item)}</li>' for item in items)
            html_parts.append(f'<ol>{items_html}</ol>')
            continue

        paragraph_lines.append(line.strip())
        i += 1

    flush_paragraph()
    return '\n'.join(html_parts)
