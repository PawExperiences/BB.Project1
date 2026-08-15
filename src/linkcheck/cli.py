"""Command-line interface for linkcheck.

Scans a single Markdown file for inline links (``[text](target)``) and
reference-style link definitions (``[id]: target``), and reports targets
that are structurally broken according to a fixed set of lexical rules.
No network access and no site root are involved: classification is purely
textual.
"""

import argparse
import re
import sys

INLINE_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]*)\)")
REFERENCE_LINK_RE = re.compile(r"^\s{0,3}\[[^\]]+\]:\s*(.*)$")

ALLOWED_SCHEMES = {"http", "https", "mailto"}
SCHEME_RE = re.compile(r"^([a-zA-Z][a-zA-Z0-9+.\-]*):")


def find_targets(lines):
    """Yield (line_number, target) for every link target, in document order.

    ``line_number`` is 1-based. ``lines`` are the file's lines with any
    trailing newline already stripped.
    """
    for line_number, line in enumerate(lines, start=1):
        reference_match = REFERENCE_LINK_RE.match(line)
        if reference_match:
            yield line_number, reference_match.group(1)
        for inline_match in INLINE_LINK_RE.finditer(line):
            yield line_number, inline_match.group(1)


def classify(target):
    """Return a short reason string if ``target`` is broken, else None."""
    if target == "":
        return "empty target"

    scheme_match = SCHEME_RE.match(target)
    if scheme_match and scheme_match.group(1).lower() not in ALLOWED_SCHEMES:
        return "unsupported scheme '{}'".format(scheme_match.group(1))

    if any(character.isspace() for character in target):
        return "target contains whitespace"

    if target.startswith("/"):
        return "relative-to-root path not supported"

    return None


def check_file(path):
    """Return broken links found in the file at ``path``.

    The result is a list of ``(line_number, target, reason)`` tuples sorted
    in ascending order of line number (document order). Raises ``OSError``
    if the file cannot be read.
    """
    with open(path, "r", encoding="utf-8") as handle:
        lines = handle.read().splitlines()

    broken = []
    for line_number, target in find_targets(lines):
        reason = classify(target)
        if reason is not None:
            broken.append((line_number, target, reason))

    broken.sort(key=lambda item: item[0])
    return broken


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="linkcheck",
        description="Check a Markdown file for structurally broken links.",
    )
    parser.add_argument("file", help="path to the Markdown file to check")
    args = parser.parse_args(argv)

    try:
        broken = check_file(args.file)
    except OSError as error:
        reason = error.strerror or str(error)
        print(
            "linkcheck: cannot read '{}': {}".format(args.file, reason),
            file=sys.stderr,
        )
        return 2

    with open(args.file, "r", encoding="utf-8") as handle:
        lines = handle.read().splitlines()
    links_found = sum(1 for _ in find_targets(lines))

    for line_number, target, reason in broken:
        print("{}:{}: {}".format(line_number, target, reason))

    print(
        "linkcheck: {} files scanned, {} links found, {} broken links".format(
            1, links_found, len(broken)
        ),
        file=sys.stderr,
    )

    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
