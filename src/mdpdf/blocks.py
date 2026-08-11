"""Block-structure Markdown parsing: headings, paragraphs, list items, and fenced code blocks."""

import re
from dataclasses import dataclass
from typing import List, Optional, Union

from .inline import InlineElement, parse_inline


@dataclass
class Heading:
    level: int
    content: List[InlineElement]


@dataclass
class Paragraph:
    content: List[InlineElement]


@dataclass
class ListItem:
    ordered: bool
    content: List[InlineElement]


@dataclass
class CodeBlock:
    language: Optional[str]
    content: str


BlockElement = Union[Heading, Paragraph, ListItem, CodeBlock]

_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_UNORDERED_RE = re.compile(r"^[-*+]\s+(.*)$")
_ORDERED_RE = re.compile(r"^\d+\.\s+(.*)$")
_FENCE_RE = re.compile(r"^```(\S*)\s*$")


def parse_blocks(text: str) -> List[BlockElement]:
    """Parse a full Markdown document into an ordered sequence of block elements."""
    lines = text.splitlines()
    blocks: List[BlockElement] = []
    paragraph_lines: List[str] = []

    def flush_paragraph() -> None:
        if paragraph_lines:
            joined = " ".join(paragraph_lines)
            blocks.append(Paragraph(parse_inline(joined)))
            paragraph_lines.clear()

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]

        fence_match = _FENCE_RE.match(line)
        if fence_match:
            flush_paragraph()
            language = fence_match.group(1) or None
            code_lines: List[str] = []
            i += 1
            while i < n and not _FENCE_RE.match(lines[i]):
                code_lines.append(lines[i])
                i += 1
            if i < n:
                i += 1  # consume closing fence
            blocks.append(CodeBlock(language, "\n".join(code_lines)))
            continue

        heading_match = _HEADING_RE.match(line)
        if heading_match:
            flush_paragraph()
            level = len(heading_match.group(1))
            blocks.append(Heading(level, parse_inline(heading_match.group(2).strip())))
            i += 1
            continue

        unordered_match = _UNORDERED_RE.match(line)
        if unordered_match:
            flush_paragraph()
            blocks.append(ListItem(False, parse_inline(unordered_match.group(1).strip())))
            i += 1
            continue

        ordered_match = _ORDERED_RE.match(line)
        if ordered_match:
            flush_paragraph()
            blocks.append(ListItem(True, parse_inline(ordered_match.group(1).strip())))
            i += 1
            continue

        if line.strip() == "":
            flush_paragraph()
            i += 1
            continue

        paragraph_lines.append(line.strip())
        i += 1

    flush_paragraph()
    return blocks
