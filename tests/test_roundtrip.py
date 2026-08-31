import pytest
from src.romans import to_roman, from_roman

def test_round_trip():
    for n in range(1, 4000):
        roman_numeral = to_roman(n)
        assert from_roman(roman_numeral) == n, f"Failed for {n}: {roman_numeral} -> {from_roman(roman_numeral)}"