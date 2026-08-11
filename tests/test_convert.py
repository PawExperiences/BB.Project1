"""Tests for the units library's public convert() API."""

import pytest

from units import convert


def test_convert_length_within_dimension_forward() -> None:
    assert convert(1, "km", "m") == 1000.0


def test_convert_length_within_dimension_reverse() -> None:
    assert convert(1000, "m", "km") == 1.0


def test_convert_mass_within_dimension_forward() -> None:
    assert convert(1, "lb", "g") == pytest.approx(453.59237)


def test_convert_mass_within_dimension_reverse() -> None:
    assert convert(453.59237, "g", "lb") == pytest.approx(1.0)


def test_convert_cross_dimension_raises() -> None:
    with pytest.raises(ValueError):
        convert(1, "km", "kg")


def test_convert_unknown_unit_raises() -> None:
    with pytest.raises(KeyError):
        convert(1, "furlong", "m")
