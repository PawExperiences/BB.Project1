# wordcount

A small Go CLI that mimics the classic `wc -lwc`: it prints the number of
lines, words, and bytes for each input.

## Usage

```sh
go build -o wordcount .

# Count one or more files
./wordcount file1.txt file2.txt

# Read from standard input when no files are given
cat file1.txt | ./wordcount
```

## Output format

For each input, a single tab-separated line is printed:

```
<lines>\t<words>\t<bytes>\t<name>
```

- `<name>` is the file path as given on the command line, or `-` for standard
  input.
- A word is a maximal run of non-whitespace characters, tokenized the same
  way as `bufio.ScanWords`.
- `<lines>` counts `\n` (newline) characters.
- `<bytes>` counts raw bytes read, not runes/characters.

When more than one input is given, a final line is printed summing the
counts across all successfully processed inputs, using `total` as the name.

## Errors

If a named file cannot be opened, `wordcount` reports
`wordcount: <name>: <error>` on stderr, continues processing the remaining
inputs, and exits with status 1. If every input is processed successfully,
it exits with status 0.
