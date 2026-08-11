# csvclean

A small command-line tool that cleans whitespace-dirty CSV files.

`csvclean` reads a CSV file, strips leading and trailing whitespace from
every field value in the data rows (the header row is passed through
unchanged), and drops any data row that is entirely empty once its fields
are stripped.

## Install

```bash
pip install -e .
```

## Usage

Write the cleaned CSV to a file:

```bash
csvclean IN.csv -o OUT.csv
```

Write the cleaned CSV to stdout:

```bash
csvclean IN.csv
```

In both cases, a summary of the run (rows read, rows dropped, fields
trimmed) is printed to stderr.

Exit codes:

- `0` — the run completed successfully.
- `2` — the input file does not exist.
