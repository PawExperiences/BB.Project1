import re
import sys

INLINE_LINK_RE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)]*)\)")
REFERENCE_DEF_RE = re.compile(r"^\s*\[[^\]]+\]:\s*(.*)$")
SCHEME_RE = re.compile(r"^([A-Za-z][A-Za-z0-9+.-]*):")

ALLOWED_SCHEMES = {"http", "https", "mailto"}


def extract_targets(lines):
    """Return (line_number, target) pairs for inline links and reference definitions."""
    targets = []
    for lineno, line in enumerate(lines, start=1):
        for match in INLINE_LINK_RE.finditer(line):
            targets.append((lineno, match.group(1)))
        ref_match = REFERENCE_DEF_RE.match(line)
        if ref_match:
            targets.append((lineno, ref_match.group(1).strip()))
    return targets


def check_target(target):
    """Return the broken-target reason for target, or None if it is fine."""
    if target.strip() == "":
        return "empty target"
    scheme_match = SCHEME_RE.match(target)
    if scheme_match and scheme_match.group(1).lower() not in ALLOWED_SCHEMES:
        return "disallowed scheme"
    if any(ch.isspace() for ch in target):
        return "contains space"
    if target.startswith("/"):
        return "root-relative path"
    return None


def main():
    args = sys.argv[1:]
    if len(args) != 1:
        print("usage: linkcheck FILE.md", file=sys.stderr)
        return 2

    path = args[0]
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except OSError as exc:
        print(f"linkcheck: cannot read {path}: {exc}", file=sys.stderr)
        return 2

    broken = False
    for lineno, target in extract_targets(lines):
        reason = check_target(target)
        if reason is not None:
            broken = True
            print(f"{lineno}:{target}: {reason}")

    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
