"""Roman numeral conversion library.

The public API is :func:`to_roman` and :func:`from_roman`. Both conversion
directions derive from the single canonical value-to-numeral table kept in
:mod:`romans.table` and imported here, so this module stays focused on the
public API.
"""

from .table import NUMERAL_TABLE

__all__ = ["to_roman", "from_roman"]


def to_roman(number: int) -> str:
    """Convert an integer between 1 and 3999 to a Roman numeral.

    Raises:
        ValueError: if ``number`` is outside the supported range.
    """
    if not 1 <= number <= 3999:
        raise ValueError("Input must be between 1 and 3999.")
    parts = []
    for value, symbol in NUMERAL_TABLE:
        while number >= value:
            parts.append(symbol)
            number -= value
    return "".join(parts)


def from_roman(numeral: str) -> int:
    """Convert a Roman numeral to its integer value.

    Raises:
        ValueError: naming the offending character if ``numeral`` is
            malformed.
    """
    value = 0
    index = 0
    for pair_value, symbol in NUMERAL_TABLE:
        while numeral.startswith(symbol, index):
            value += pair_value
            index += len(symbol)
    if index != len(numeral):
        raise ValueError(f"Invalid character in Roman numeral: {numeral[index]!r}")
    return value
