"""Tests for the canonical numeral table in src/romans/table.py."""

from romans import NUMERAL_TABLE as REEXPORTED_NUMERAL_TABLE
from romans.table import NUMERAL_TABLE

EXPECTED_PAIRS = (
    (1000, "M"),
    (900, "CM"),
    (500, "D"),
    (400, "CD"),
    (100, "C"),
    (90, "XC"),
    (50, "L"),
    (40, "XL"),
    (10, "X"),
    (9, "IX"),
    (5, "V"),
    (4, "IV"),
    (1, "I"),
)

SUBTRACTIVE_PAIRS = {
    (900, "CM"),
    (400, "CD"),
    (90, "XC"),
    (40, "XL"),
    (9, "IX"),
    (4, "IV"),
}


def test_table_has_exactly_the_13_expected_pairs() -> None:
    assert NUMERAL_TABLE == EXPECTED_PAIRS
    assert len(NUMERAL_TABLE) == 13


def test_table_is_strictly_descending_by_value() -> None:
    values = [value for value, _numeral in NUMERAL_TABLE]
    for earlier, later in zip(values, values[1:]):
        assert earlier > later


def test_table_contains_all_six_subtractive_pairs() -> None:
    assert SUBTRACTIVE_PAIRS.issubset(NUMERAL_TABLE)
    assert len(SUBTRACTIVE_PAIRS) == 6


def test_package_reexports_the_table() -> None:
    assert REEXPORTED_NUMERAL_TABLE is NUMERAL_TABLE
