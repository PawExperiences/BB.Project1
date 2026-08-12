# linkcheck

A command-line tool that scans a single Markdown file and reports links
whose targets are syntactically broken. This is a purely static/lexical
check -- `linkcheck` makes no network requests and never confirms that a
URL is actually reachable.

## Install

```
pip install .
```

This installs the `linkcheck` console script on your `PATH`. `linkcheck`
has no third-party runtime dependencies -- only the Python standard
library is used.

## Usage

```
linkcheck <file.md>
```

`linkcheck` extracts:

- every inline link `[text](target)` in the file (excluding image syntax
  `![alt](target)`), together with the 1-based line number it occurs on;
- every reference-style link definition `[id]: target` anchored at the
  start of a line (up to 3 leading spaces permitted), together with its
  1-based line number. Usages of the form `[text][id]` are not resolved
  or separately checked -- only the definition line's own target is
  evaluated.

## Broken-link rules

For each extracted target, brokenness is determined by checking, in
order, and reporting the reason of the first match:

1. The target is empty or whitespace-only -> `empty target`
2. The target contains a `:` and the substring before the first `:`
   (case-insensitive) is not `http`, `https`, or `mailto` ->
   `unsupported scheme`
3. The target contains any whitespace character -> `contains a space`
4. The target has no `:` scheme and starts with `/` ->
   `absolute path not supported`

Targets matching none of these rules are valid and are not reported.
This means relative paths (`./foo.md`, `../foo.md`), bare fragments
(`#section`), and valid `http`/`https`/`mailto` URLs are all considered
valid.

Markdown link titles (e.g. `(url "Title")` or `[id]: url "Title"`) are
not stripped -- the whole captured target string is used as-is, so a
target with a trailing title will typically be flagged
`contains a space`.

## Output format

For every broken target, `linkcheck` prints one line to stdout,
in the order the targets were encountered in the file:

```
<line>:<target>: <reason>
```

## Exit codes

- `0` -- no broken links were found; no broken-link lines are printed.
- `1` -- one or more broken links were found.
- non-zero, non-`1` (e.g. `2`) -- the given file path does not exist or
  could not be read as text; an error message is printed to stderr.
