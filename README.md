# linkcheck

A small CLI that scans a single Markdown file, extracts the links it
contains, and reports any that are broken. Checks are purely syntactic — no
network requests are made to verify that a link actually resolves.

## Install

From the repository root:

```sh
pip install .
```

(or `uv pip install .`)

This installs the `linkcheck` package and puts a `linkcheck` command on your
PATH.

## Usage

```sh
linkcheck FILE.md
```

`linkcheck` takes exactly one argument: the path to a Markdown file. Running
it with no argument, or with a path that does not exist, prints an error to
stderr and exits with a non-zero status.

### What gets extracted

- Inline links: `[text](target)`
- Reference-style link definitions: `[id]: target`

Nothing else is extracted or checked: image syntax (`![alt](target)`),
autolinks (`<https://...>`), bare URLs, HTML `<a href>` links, and
reference-link usages (`[text][id]`) are all ignored. Extraction is a simple
line/regex scan; it is not aware of fenced code blocks or HTML comments.

### Broken-target rules

A target is considered broken when any of the following hold, checked in
this order (the first match is the only reason reported):

1. It is empty or blank — `empty target`
2. It has a scheme (the text before the first `:`, matching
   `[A-Za-z][A-Za-z0-9+.-]*`) that is not `http`, `https`, or `mailto` —
   `disallowed scheme`
3. It contains a whitespace character anywhere — `contains space`
4. It starts with `/` (root-relative; this tool has no notion of a site
   root) — `root-relative path`

Targets with no scheme at all — relative paths like `./foo.md`, `foo.md`,
`../x`, or fragment-only targets like `#section` — are never rejected by
rule 2, and are only broken if they hit rule 1, 3, or 4.

### Output and exit code

For every broken target, one line is printed to stdout:

```
<line>:<target>: <reason>
```

where `<line>` is the 1-indexed source line number of the link or reference
definition, and `<target>` is the raw target string as extracted. stdout is
reserved for this output and is unaffected by anything below, so it stays
safe to pipe or parse.

After a scan completes, a one-line human-readable summary — files scanned,
total links found, and total broken links — is printed to **stderr**. It
never appears on stdout.

#### Exit codes

| Code | Meaning |
| ---- | ------- |
| `0`  | The scan completed and found no broken links. |
| `1`  | The scan completed and found one or more broken links. |
| `2`  | Usage error (missing argument, unrecognized option, or a target path that doesn't exist/can't be read). No scan was performed and no summary is printed. |
