import pytest

from units import convert


@pytest.mark.parametrize(
    ("value", "frm", "to"),
    [
        (1.0, "km", "m"),
        (12.0, "inch", "ft"),
        (100.0, "mile", "cm"),
    ],
)
def test_length_round_trip(value, frm, to):
    converted = convert(value, frm, to)
    back = convert(converted, to, frm)
    assert back == pytest.approx(value)


@pytest.mark.parametrize(
    ("value", "frm", "to"),
    [
        (1.0, "kg", "g"),
        (5.0, "lb", "oz"),
        (250.0, "g", "kg"),
    ],
)
def test_mass_round_trip(value, frm, to):
    converted = convert(value, frm, to)
    back = convert(converted, to, frm)
    assert back == pytest.approx(value)


def test_cross_dimension_conversion_raises():
    with pytest.raises(ValueError):
        convert(1.0, "km", "kg")


def test_unknown_source_unit_raises():
    with pytest.raises(KeyError):
        convert(1.0, "furlong", "m")


def test_unknown_target_unit_raises():
    with pytest.raises(KeyError):
        convert(1.0, "m", "furlong")
