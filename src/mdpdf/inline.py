"""Inline Markdown parsing: text, bold, italic, inline code, and links."""

import re
from dataclasses import dataclass
from typing import List, Union


@dataclass
class Text:
    content: str


@dataclass
class Bold:
    content: str


@dataclass
class Italic:
    content: str


@dataclass
class Code:
    content: str


@dataclass
class Link:
    text: str
    url: str


InlineElement = Union[Text, Bold, Italic, Code, Link]

_INLINE_PATTERN = re.compile(
    r"""
    (?P<code>`(?P<code_content>[^`]+)`)
    |(?P<bold>\*\*(?P<bold_content>.+?)\*\*)
    |(?P<italic>\*(?P<italic_content>.+?)\*)
    |(?P<link>\[(?P<link_text>[^\]]*)\]\((?P<link_url>[^)]*)\))
    """,
    re.VERBOSE | re.DOTALL,
)


def parse_inline(text: str) -> List[InlineElement]:
    """Parse a span of Markdown text into an ordered sequence of inline elements."""
    elements: List[InlineElement] = []
    pos = 0
    plain_parts: List[str] = []

    def flush_plain() -> None:
        if plain_parts:
            elements.append(Text("".join(plain_parts)))
            plain_parts.clear()

    for match in _INLINE_PATTERN.finditer(text):
        start, end = match.span()
        if start > pos:
            plain_parts.append(text[pos:start])
        flush_plain()

        if match.group("code") is not None:
            elements.append(Code(match.group("code_content")))
        elif match.group("bold") is not None:
            elements.append(Bold(match.group("bold_content")))
        elif match.group("italic") is not None:
            elements.append(Italic(match.group("italic_content")))
        else:
            elements.append(Link(match.group("link_text"), match.group("link_url")))

        pos = end

    if pos < len(text):
        plain_parts.append(text[pos:])
    flush_plain()

    return elements
