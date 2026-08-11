from mdpdf.blocks import CodeBlock, Heading, ListItem, Paragraph, parse_blocks
from mdpdf.inline import Bold, Text


def test_heading_levels():
    result = parse_blocks("# One\n## Two\n###### Six")
    assert result == [
        Heading(1, [Text("One")]),
        Heading(2, [Text("Two")]),
        Heading(6, [Text("Six")]),
    ]


def test_heading_text_is_inline_parsed():
    result = parse_blocks("# Hello **world**")
    assert result == [Heading(1, [Text("Hello "), Bold("world")])]


def test_paragraph_merges_consecutive_lines():
    result = parse_blocks("line one\nline two\n\nnext paragraph")
    assert result == [
        Paragraph([Text("line one line two")]),
        Paragraph([Text("next paragraph")]),
    ]


def test_unordered_list_items():
    result = parse_blocks("- a\n* b\n+ c")
    assert result == [
        ListItem(False, [Text("a")]),
        ListItem(False, [Text("b")]),
        ListItem(False, [Text("c")]),
    ]


def test_ordered_list_items():
    result = parse_blocks("1. a\n2. b")
    assert result == [
        ListItem(True, [Text("a")]),
        ListItem(True, [Text("b")]),
    ]


def test_list_item_text_is_inline_parsed():
    result = parse_blocks("- **bold** item")
    assert result == [ListItem(False, [Bold("bold"), Text(" item")])]


def test_fenced_code_block_with_language():
    doc = "```python\nprint('hi')\n\nx = 1\n```"
    result = parse_blocks(doc)
    assert result == [CodeBlock("python", "print('hi')\n\nx = 1")]


def test_fenced_code_block_without_language_and_not_inline_parsed():
    doc = "```\n**not bold**\n```"
    result = parse_blocks(doc)
    assert result == [CodeBlock(None, "**not bold**")]


def test_mixed_document():
    doc = "# Title\n\nSome text with **bold**.\n\n- item one\n- item two\n\n```js\nconsole.log(1);\n```"
    result = parse_blocks(doc)
    assert result == [
        Heading(1, [Text("Title")]),
        Paragraph([Text("Some text with "), Bold("bold"), Text(".")]),
        ListItem(False, [Text("item one")]),
        ListItem(False, [Text("item two")]),
        CodeBlock("js", "console.log(1);"),
    ]
