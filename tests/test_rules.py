import csv
from pathlib import Path

from csvclean.rules import clean_row, is_blank

FIXTURE = Path(__file__).parent / "fixtures" / "messy.csv"


def _read_fixture_rows():
    with FIXTURE.open(newline="") as f:
        return list(csv.reader(f))


def _clean_csv(rows):
    header, *data_rows = rows
    cleaned = [header]
    for row in data_rows:
        if is_blank(row):
            continue
        cleaned.append(clean_row(row))
    return cleaned


def test_quoted_comma_survives_as_literal_data():
    rows = _read_fixture_rows()
    cleaned = _clean_csv(rows)

    quoted_row = next(row for row in cleaned[1:] if row[0] == "Smith, John")

    assert quoted_row == ["Smith, John", "30", "Boston"]


def test_blank_and_whitespace_only_rows_are_dropped():
    rows = _read_fixture_rows()
    cleaned = _clean_csv(rows)

    assert [] not in cleaned
    assert not any(is_blank(row) for row in cleaned[1:])
    assert len(cleaned) == 3  # header + two genuine data rows


def test_header_row_preserved_verbatim():
    rows = _read_fixture_rows()
    cleaned = _clean_csv(rows)

    assert cleaned[0] == rows[0]
    assert cleaned[0] == ["  Name ", " Age ", "  City  "]
