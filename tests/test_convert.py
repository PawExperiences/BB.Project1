import pytest

from units import convert


def test_length_conversion_forward():
    assert convert(1, "mile", "m") == pytest.approx(1609.344)


def test_length_conversion_reverse():
    assert convert(1609.344, "m", "mile") == pytest.approx(1)


def test_mass_conversion_forward():
    assert convert(1, "kg", "g") == pytest.approx(1000.0)


def test_mass_conversion_reverse():
    assert convert(1000, "g", "kg") == pytest.approx(1.0)


def test_cross_dimension_conversion_raises():
    with pytest.raises(ValueError):
        convert(1, "m", "kg")


def test_unrecognized_unit_raises():
    with pytest.raises(KeyError):
        convert(1, "m", "furlong")
