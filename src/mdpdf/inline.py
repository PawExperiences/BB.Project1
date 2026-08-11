import html
import re

_INLINE_PATTERN = re.compile(
    r'`(?P<code>[^`]+)`'
    r'|\[(?P<link_text>[^\]]*)\]\((?P<link_url>[^)\s]+)\)'
    r'|\*\*(?P<bold1>[^*]+?)\*\*'
    r'|__(?P<bold2>[^_]+?)__'
    r'|\*(?P<italic1>[^*]+?)\*'
    r'|_(?P<italic2>[^_]+?)_'
)


def _escape(text: str) -> str:
    return html.escape(text, quote=False)


def _render_match(match: re.Match) -> str:
    if match.group('code') is not None:
        return f'<code>{_escape(match.group("code"))}</code>'
    if match.group('link_text') is not None:
        link_text = _escape(match.group('link_text'))
        link_url = html.escape(match.group('link_url'), quote=True)
        return f'<a href="{link_url}">{link_text}</a>'
    if match.group('bold1') is not None:
        return f'<strong>{_escape(match.group("bold1"))}</strong>'
    if match.group('bold2') is not None:
        return f'<strong>{_escape(match.group("bold2"))}</strong>'
    if match.group('italic1') is not None:
        return f'<em>{_escape(match.group("italic1"))}</em>'
    return f'<em>{_escape(match.group("italic2"))}</em>'


def render_inline(text: str) -> str:
    pieces = []
    pos = 0
    for match in _INLINE_PATTERN.finditer(text):
        pieces.append(_escape(text[pos:match.start()]))
        pieces.append(_render_match(match))
        pos = match.end()
    pieces.append(_escape(text[pos:]))
    return ''.join(pieces)
