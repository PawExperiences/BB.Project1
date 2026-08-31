import pytest
from src.romans import to_roman, from_roman

# Round-trip test for Roman numeral conversion


def test_round_trip_conversion():
    for i in range(1, 4000):
        roman = to_roman(i)
        assert roman == from_roman(roman), f"Failed on {i}: {roman}"
