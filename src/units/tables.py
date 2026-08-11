"""Unit-conversion factor tables.

Each dict maps a unit symbol to its multiplicative factor against that
dimension's base unit: metres for length, grams for mass.
"""

LENGTH_FACTORS: dict[str, float] = {
    "m": 1.0,
    "km": 1000.0,
    "cm": 0.01,
    "mm": 0.001,
}

MASS_FACTORS: dict[str, float] = {
    "g": 1.0,
    "kg": 1000.0,
    "mg": 0.001,
}
