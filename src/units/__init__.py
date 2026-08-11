"""units: convert between common length and mass units."""

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


def _table_for(unit: str) -> dict[str, float]:
    if unit in LENGTH_FACTORS:
        return LENGTH_FACTORS
    if unit in MASS_FACTORS:
        return MASS_FACTORS
    raise KeyError(unit)


def convert(value: float, frm: str, to: str) -> float:
    """Convert value from unit frm to unit to.

    Both units must belong to the same dimension (length or mass). Raises
    ValueError if frm and to belong to different dimensions, or KeyError if
    either unit is not a recognised length or mass unit.
    """
    frm_table = _table_for(frm)
    to_table = _table_for(to)
    if frm_table is not to_table:
        raise ValueError(f"cannot convert between {frm!r} and {to!r}: incompatible dimensions")
    return value * frm_table[frm] / frm_table[to]
