# wordcount

A `wc`-style word/line/byte counting CLI written in Go.

## Build

```sh
go build ./...
```

This produces a `wordcount` binary (or run directly with `go run .`, see below).

## Run

Count one or more files:

```sh
go run . file1.txt file2.txt
```

Count from stdin (used when no file arguments are given):

```sh
cat file1.txt | go run .
```

## Output format

For each input processed, one line is printed to stdout:

```
<lines>\t<words>\t<bytes>\t<name>
```

- `lines` is the number of `\n` bytes in the input.
- `words` is the number of maximal runs of non-whitespace characters, matching
  `bufio.ScanWords` semantics.
- `bytes` is the number of raw bytes read from the input.
- `name` is `-` for stdin, or the file name/path exactly as given on the
  command line.

When more than one file argument is supplied, an additional final line is
printed after the per-file lines, summing the counts across all successfully
processed inputs, with `total` as its name.

## Usage examples

The table below shows the exact output of `wordcount` (piped via stdin, so
`name` is `-`) for four input scenarios, matching the cases covered by the
automated tests in `count_test.go`:

| Input | Output |
| --- | --- |
| Empty input (no bytes) | `0	0	0	-` |
| Single line, no trailing newline: `hello world` | `0	2	11	-` |
| Line with repeated/multiple consecutive spaces: `hello   world\n` | `1	2	14	-` |
| Line with a multi-byte UTF-8 character: `héllo\n` (6 characters, 7 bytes) | `1	1	7	-` |

## Errors

If a named file cannot be opened, the program writes:

```
wordcount: <name>: <error>
```

to stderr, skips the counts line for that file, and continues processing the
remaining named files. The process exits with status 1 if any file could not
be opened, and 0 if every input was processed successfully.
