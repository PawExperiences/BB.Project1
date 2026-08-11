"""Unit-conversion factor tables.

Single source of truth for the multiplicative factors used to convert
between units within a dimension. Each dict maps a unit symbol to the
factor that converts a value in that unit to the dimension's base unit.
"""

LENGTH_FACTORS: dict[str, float] = {
    "mm": 0.001,
    "cm": 0.01,
    "m": 1.0,
    "km": 1000.0,
    "in": 0.0254,
    "ft": 0.3048,
    "yd": 0.9144,
    "mi": 1609.344,
}

MASS_FACTORS: dict[str, float] = {
    "mg": 0.001,
    "g": 1.0,
    "kg": 1000.0,
    "oz": 28.349523125,
    "lb": 453.59237,
}
