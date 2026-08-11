# linkcheck

A CLI that scans a single Markdown file, extracts every inline link
(`[text](target)`) and reference-style link definition (`[id]: target`), and
reports which targets are syntactically broken.

This tool has no site root, so it cannot resolve relative paths. It only
flags a small, fixed set of clearly-invalid target shapes. No live HTTP
requests are made — validation is purely syntactic.

A target is considered **broken** when:

- it is empty
- it has a URI scheme (`scheme:`) that is not `http`, `https`, or `mailto`
  (case-insensitive)
- it contains a whitespace character
- it starts with `/`

## Installation

```sh
pip install .
```

This exposes a `linkcheck` console command.

## Usage

```sh
linkcheck <path-to-markdown-file>
```

### Example

```sh
linkcheck docs/README.md
```

For every broken target, one line is printed to stdout in the format:

```
<line>:<target>: <reason>
```

where `<reason>` is one of `empty target`, `disallowed scheme`, `contains
space`, or `absolute path`. stdout carries only this machine-parseable
output — nothing else is ever written there.

After a run completes, a human-readable summary reporting the number of
files scanned, links found, and broken links is printed to **stderr**. It
never appears on stdout, so scripts consuming stdout do not need to filter
it out.

## Exit codes

| Code | Meaning |
| ---- | ------- |
| `0`  | The run completed and no broken links were found. |
| `1`  | The run completed and at least one broken link was found. |
| `2`  | The CLI was invoked incorrectly — a missing required argument, a nonexistent/unreadable input path, or an unrecognized option. No run summary is printed in this case. |
