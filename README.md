# wordcount

A `wc`-like word-count CLI written in Go.

## Usage

```
wordcount [file...]
```

Reads each named file, or stdin when no files are given, and writes one line
per input to stdout in the form:

```
<lines>\t<words>\t<bytes>\t<name>
```

- `lines` is the number of `\n` bytes in the input.
- `words` is the number of whitespace-separated tokens.
- `bytes` is the raw byte length of the input.
- `name` is the file name, or `-` for stdin.

When more than one file is given, a final `total` line sums each column
across the successfully-read files.

If a named file cannot be opened, an error is written to stderr in the form
`wordcount: <name>: <error>`, that file is skipped, and the remaining files
are still processed. The process exits with status 1 if any file failed to
open, and 0 otherwise.

## Build

```
go build ./...
```
