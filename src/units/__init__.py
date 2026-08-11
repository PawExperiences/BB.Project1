"""Convert numeric values between units of length and units of mass.

Each dimension is backed by a single lookup table mapping a unit symbol to
its multiplicative factor against that dimension's base unit: metres for
length, grams for mass. Adding a new unit to a dimension is a one-line
addition to the relevant table.
"""

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

__all__ = ["convert"]


def convert(value: float, frm: str, to: str) -> float:
    """Convert ``value`` from unit ``frm`` to unit ``to``.

    ``frm`` and ``to`` must be units of the same dimension (both length or
    both mass). Raises ``KeyError`` if either unit is not recognized, and
    ``ValueError`` if the two units belong to different dimensions.
    """
    frm_dim = _dimension(frm)
    to_dim = _dimension(to)

    if frm_dim != to_dim:
        raise ValueError(
            f"cannot convert between units of different dimensions: "
            f"{frm!r} ({frm_dim}) and {to!r} ({to_dim})"
        )

    factors = LENGTH_FACTORS if frm_dim == "length" else MASS_FACTORS
    return value * (factors[frm] / factors[to])


def _dimension(unit: str) -> str:
    if unit in LENGTH_FACTORS:
        return "length"
    if unit in MASS_FACTORS:
        return "mass"
    raise KeyError(unit)
