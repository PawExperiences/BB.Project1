"""Public API for the units package: convert values between length units and between mass units."""

LENGTH_FACTORS: dict[str, float] = {
    "m": 1.0,
    "km": 1000.0,
    "cm": 0.01,
    "mm": 0.001,
    "inch": 0.0254,
    "ft": 0.3048,
    "mile": 1609.344,
}

MASS_FACTORS: dict[str, float] = {
    "g": 1.0,
    "kg": 1000.0,
    "oz": 28.349523125,
    "lb": 453.59237,
}

_DIMENSIONS: dict[str, dict[str, float]] = {
    "length": LENGTH_FACTORS,
    "mass": MASS_FACTORS,
}


def _dimension_of(unit: str) -> str:
    for dimension, factors in _DIMENSIONS.items():
        if unit in factors:
            return dimension
    raise KeyError(unit)


def convert(value: float, frm: str, to: str) -> float:
    """Convert value from unit frm to unit to. Both units must be from the same dimension."""
    frm_dimension = _dimension_of(frm)
    to_dimension = _dimension_of(to)

    if frm_dimension != to_dimension:
        raise ValueError(
            f"cannot convert from {frm!r} ({frm_dimension}) to {to!r} ({to_dimension})"
        )

    factors = _DIMENSIONS[frm_dimension]
    return value * factors[frm] / factors[to]


__all__ = ["convert"]
