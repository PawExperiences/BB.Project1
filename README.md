# linkcheck

A static Markdown link checker. Given a single Markdown file, `linkcheck`
scans it for inline links and reference-style link definitions, decides
which targets are structurally broken using a fixed set of lexical rules,
and reports the result via stdout and its exit code — no network access,
no site root.

## Installation

```
pip install .
```

This installs the `linkcheck` console script on your `PATH`.

## Usage

```
linkcheck <file>
```

`<file>` is the path to a single Markdown file to check. `linkcheck` takes
no other arguments.

## What it checks

`linkcheck` extracts two kinds of link targets from the given file, along
with the 1-based line number on which each occurs:

- Inline links: `[text](target)`
- Reference-style link definitions: `[id]: target`

A target is classified **BROKEN** when any of the following is true:

- it is an empty string;
- it has a URI scheme other than `http`, `https`, or `mailto` (e.g.
  `ftp://...`, `tel:...`);
- it contains a whitespace character;
- it starts with `/` (a path relative to a site root — unsupported, since
  `linkcheck` has no notion of a site root).

Targets that are not caught by any of these rules (including relative
paths, `#fragment` anchors, and allowed-scheme URLs) are considered fine.

This is purely lexical, static validation: `linkcheck` never makes network
requests and never resolves paths against a site root.

Note: image syntax `![alt](target)` textually contains the inline-link
pattern `[alt](target)`, so a broken image target is reported the same way
as a broken link target — this is expected behavior, not a bug.

## Output format

For each broken link, `linkcheck` prints one line to stdout:

```
<line>:<target>: <reason>
```

- `<line>` is the 1-based source line number of the occurrence.
- `<target>` is the raw target text exactly as it appeared in the file.
- `<reason>` is a short, deterministic, human-readable description of
  which rule was violated.

Lines are printed in ascending order of line number (document order).

After a scan completes, `linkcheck` prints one summary line to **stderr**
(never stdout) reporting the number of files scanned, the number of links
found, and the number of broken links found, e.g.:

```
linkcheck: 1 files scanned, 5 links found, 2 broken links
```

Keeping the summary off stdout means stdout stays reserved for the
per-link output above, so downstream tooling can pipe stdout without the
summary text getting in the way. The summary is only printed when a scan
actually completes — it is not printed on a usage error.

## Exit Status

`linkcheck` commits to a stable exit-status contract so callers (scripts,
CI) can branch on the exit code without parsing output:

- `0` — clean: the scan completed and no broken links were found.
- `1` — broken links found: the scan completed and at least one broken
  link was found; each is printed to stdout.
- `2` — usage error: bad or missing arguments, or an invalid/nonexistent
  file path. No scan is attempted; an error message is printed to
  stderr.
