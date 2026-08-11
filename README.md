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
space`, or `absolute path`.

The process exits with status `1` if any broken links were found, and `0`
otherwise.
