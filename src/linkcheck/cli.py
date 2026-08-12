"""Command-line entry point for linkcheck.

Scans a single Markdown file for inline links ``[text](target)`` and
reference-style link definitions ``[id]: target`` and reports targets
that are syntactically broken. This is a static/lexical check only --
no network requests are made.
"""

import argparse
import re
import sys

_INLINE_LINK_RE = re.compile(r"(?<!!)\[([^\]]*)\]\(([^)]*)\)")
_REFERENCE_DEF_RE = re.compile(r"^ {0,3}\[([^\]]+)\]:\s*(.*)$")

_VALID_SCHEMES = ("http", "https", "mailto")


def extract_targets(text):
    """Return a list of (line_number, target) tuples in encounter order."""
    targets = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for match in _INLINE_LINK_RE.finditer(line):
            targets.append((lineno, match.group(2)))
        ref_match = _REFERENCE_DEF_RE.match(line)
        if ref_match:
            targets.append((lineno, ref_match.group(2)))
    return targets


def classify(target):
    """Return the broken-link reason for target, or None if it is valid."""
    if target.strip() == "":
        return "empty target"
    if ":" in target:
        scheme = target.split(":", 1)[0].lower()
        if scheme not in _VALID_SCHEMES:
            return "unsupported scheme"
    if any(ch.isspace() for ch in target):
        return "contains a space"
    if ":" not in target and target.startswith("/"):
        return "absolute path not supported"
    return None


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="linkcheck",
        description="Check a Markdown file for syntactically broken links.",
    )
    parser.add_argument("file", help="path to the Markdown file to check")
    args = parser.parse_args(argv)

    try:
        with open(args.file, "r", encoding="utf-8") as handle:
            text = handle.read()
    except (OSError, UnicodeDecodeError) as exc:
        print(f"linkcheck: error: could not read {args.file}: {exc}", file=sys.stderr)
        return 2

    found_broken = False
    for lineno, target in extract_targets(text):
        reason = classify(target)
        if reason is not None:
            found_broken = True
            print(f"{lineno}:{target}: {reason}")

    return 1 if found_broken else 0


if __name__ == "__main__":
    sys.exit(main())
