"""Command-line entry point for csvclean."""

import argparse
import csv
import sys

from .rules import clean_row, is_blank


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="csvclean",
        description="Strip whitespace from CSV field values and drop empty rows.",
    )
    parser.add_argument("input", help="path to the input CSV file")
    parser.add_argument(
        "-o",
        "--output",
        metavar="OUT.csv",
        help="path to write the cleaned CSV (defaults to stdout)",
    )
    args = parser.parse_args(argv)

    try:
        infile = open(args.input, newline="", encoding="utf-8")
    except FileNotFoundError:
        print(f"csvclean: error: input file not found: {args.input}", file=sys.stderr)
        return 2

    rows_read = 0
    rows_dropped = 0
    fields_trimmed = 0
    cleaned_rows = []

    with infile:
        reader = csv.reader(infile)
        header = next(reader, [])

        for row in reader:
            rows_read += 1
            cleaned = clean_row(row)
            fields_trimmed += sum(
                1 for original, stripped in zip(row, cleaned) if original != stripped
            )
            if is_blank(row):
                rows_dropped += 1
                continue
            cleaned_rows.append(cleaned)

    if args.output:
        with open(args.output, "w", newline="", encoding="utf-8") as outfile:
            writer = csv.writer(outfile)
            writer.writerow(header)
            writer.writerows(cleaned_rows)
    else:
        writer = csv.writer(sys.stdout)
        writer.writerow(header)
        writer.writerows(cleaned_rows)

    print(
        f"csvclean: rows read: {rows_read}, rows dropped: {rows_dropped}, "
        f"fields trimmed: {fields_trimmed}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
