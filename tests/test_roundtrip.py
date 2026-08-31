import pytest
from romans import to_roman, from_roman

def test_round_trip_conversion():
    for i in range(1, 4000):
        roman_numeral = to_roman(i)
        assert from_roman(roman_numeral) == i
