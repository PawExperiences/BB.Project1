"""CLI for linkcheck: extract Markdown link targets and flag broken ones."""

import argparse
import re
import sys

_INLINE_LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]*)\)")
_REFERENCE_DEF_RE = re.compile(r"^\s{0,3}\[([^\]]+)\]:\s*(.*)$")
_TRAILING_TITLE_RE = re.compile(r'^(.*?)\s+"[^"]*"\s*$')
_SCHEME_RE = re.compile(r"^([A-Za-z][A-Za-z0-9+.\-]*):")
_ALLOWED_SCHEMES = ("http", "https", "mailto")


def classify_target(target):
    """Return the broken-target reason for `target`, or None if it's fine."""
    if target == "":
        return "empty target"
    scheme_match = _SCHEME_RE.match(target)
    if scheme_match and scheme_match.group(1).lower() not in _ALLOWED_SCHEMES:
        return "disallowed scheme"
    if re.search(r"\s", target):
        return "contains space"
    if target.startswith("/"):
        return "absolute path"
    return None


def extract_targets(lines):
    """Yield (line_number, target) pairs in file order for `lines`."""
    for lineno, line in enumerate(lines, start=1):
        occurrences = []
        for match in _INLINE_LINK_RE.finditer(line):
            occurrences.append((match.start(2), match.group(2)))
        ref_match = _REFERENCE_DEF_RE.match(line)
        if ref_match:
            rest = ref_match.group(2)
            title_match = _TRAILING_TITLE_RE.match(rest)
            target = title_match.group(1) if title_match else rest.rstrip()
            occurrences.append((ref_match.start(2), target))
        occurrences.sort(key=lambda item: item[0])
        for _, target in occurrences:
            yield lineno, target


def find_broken_links(lines):
    """Return a list of (line_number, target, reason) for broken targets, in order."""
    broken = []
    for lineno, target in extract_targets(lines):
        reason = classify_target(target)
        if reason is not None:
            broken.append((lineno, target, reason))
    return broken


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="linkcheck",
        description="Scan a Markdown file and report syntactically broken link targets.",
    )
    parser.add_argument("path", help="Path to the Markdown file to check.")
    args = parser.parse_args(argv)

    try:
        with open(args.path, "r", encoding="utf-8") as handle:
            lines = handle.read().splitlines()
    except OSError as exc:
        print(f"linkcheck: {exc.strerror}: {args.path}", file=sys.stderr)
        return 2

    links_found = sum(1 for _ in extract_targets(lines))
    broken = find_broken_links(lines)
    for lineno, target, reason in broken:
        print(f"{lineno}:{target}: {reason}")

    print(
        "\n".join(
            [
                "Summary:",
                "  files scanned: 1",
                f"  links found: {links_found}",
                f"  broken links: {len(broken)}",
            ]
        ),
        file=sys.stderr,
    )

    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
