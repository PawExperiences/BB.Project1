from mdpdf.inline import Bold, Code, Italic, Link, Text, parse_inline


def test_plain_text():
    assert parse_inline("hello world") == [Text("hello world")]


def test_bold():
    assert parse_inline("a **b** c") == [Text("a "), Bold("b"), Text(" c")]


def test_italic():
    assert parse_inline("a *b* c") == [Text("a "), Italic("b"), Text(" c")]


def test_inline_code():
    assert parse_inline("a `b` c") == [Text("a "), Code("b"), Text(" c")]


def test_link():
    assert parse_inline("a [b](c) d") == [Text("a "), Link("b", "c"), Text(" d")]


def test_mixed_adjacent_constructs_in_order():
    result = parse_inline("a **b** *c* `d` [e](f) g")
    assert result == [
        Text("a "),
        Bold("b"),
        Text(" "),
        Italic("c"),
        Text(" "),
        Code("d"),
        Text(" "),
        Link("e", "f"),
        Text(" g"),
    ]


def test_code_span_content_is_never_reinterpreted():
    result = parse_inline("`*not bold* [not](a link)`")
    assert result == [Code("*not bold* [not](a link)")]
