# wordcount

A `wc`-style word-count CLI written in Go. It reports line, word, and byte
counts for one or more files, or for standard input when no files are given.

## Build

```sh
go build ./...
```

## Run

Count one or more files:

```sh
./wordcount file1.txt file2.txt
```

Each file prints a line of the form:

```
<lines>\t<words>\t<bytes>\t<name>
```

When more than one file is given, a final `total` line is printed summing the
counts of every file that was read successfully.

Read from standard input when no file arguments are given:

```sh
cat file.txt | ./wordcount
```

This prints a single line using `-` as the name:

```
<lines>\t<words>\t<bytes>\t-
```

## Counting rules

- **Lines** are the number of `\n` bytes in the input.
- **Words** are the number of whitespace-separated tokens, as produced by a
  `bufio.Scanner` using `bufio.ScanWords`.
- **Bytes** are the raw byte count of the input.

## Errors

If a named file cannot be opened, an error is written to stderr in the form
`wordcount: <name>: <error>`, that file is skipped, and processing continues
with the remaining files. The process exits with status 1 if any file failed
to open, and 0 otherwise.
