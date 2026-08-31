"""Integer <-> Roman numeral conversion over the range 1..3999.

Public API:

- ``to_roman(n)`` encodes an integer in 1..3999 as a canonical Roman
  numeral (using the subtractive pairs IV, IX, XL, XC, CD and CM).
- ``from_roman(s)`` strictly decodes exactly those canonical numerals
  back to their integer.

Both directions are driven by one canonical value-to-numeral table, so
the round-trip is lossless over the whole domain:
``from_roman(to_roman(n)) == n`` for every ``n`` in 1..3999.
Out-of-range integers, non-integer inputs and malformed numerals raise
``ValueError``.
"""

__all__ = ["to_roman", "from_roman"]

_MIN_VALUE = 1
_MAX_VALUE = 3999

# The single canonical value-to-numeral table shared by the encoder and
# the decoder: descending by value, with the six subtractive pairs in
# their canonical positions. Because both directions are driven by this
# one table, the round-trip over 1..3999 is lossless.
_NUMERAL_TABLE: tuple[tuple[int, str], ...] = (
    (1000, "M"),
    (900, "CM"),
    (500, "D"),
    (400, "CD"),
    (100, "C"),
    (90, "XC"),
    (50, "L"),
    (40, "XL"),
    (10, "X"),
    (9, "IX"),
    (5, "V"),
    (4, "IV"),
    (1, "I"),
)

# Value of each single numeral letter, and the set of canonical
# subtractive pairs, both derived from the shared table.
_VALUES: dict[str, int] = {
    numeral: value for value, numeral in _NUMERAL_TABLE if len(numeral) == 1
}
_SUBTRACTIVE_PAIRS: set[str] = {
    numeral for _, numeral in _NUMERAL_TABLE if len(numeral) == 2
}

# Repetition rules: I, X, C and M may repeat up to three times in a row;
# V, L and D never repeat.
_REPEATABLE: frozenset[str] = frozenset("IXCM")
_MAX_RUN = 3


def to_roman(n: int) -> str:
    """Encode an integer in 1..3999 as a canonical Roman numeral.

    Raises:
        ValueError: if ``n`` is not an integer (``bool`` included),
            naming the valid integer range; if ``n < 1``, naming the
            lower bound ``1``; or if ``n > 3999``, naming the upper
            bound ``3999``.
    """
    if not isinstance(n, int) or isinstance(n, bool):
        raise ValueError(
            f"n must be an integer in the range {_MIN_VALUE}..{_MAX_VALUE}; "
            f"got {n!r}"
        )
    if n < _MIN_VALUE:
        raise ValueError(f"n must be at least {_MIN_VALUE}; got {n}")
    if n > _MAX_VALUE:
        raise ValueError(f"n must be at most {_MAX_VALUE}; got {n}")

    parts: list[str] = []
    remainder = n
    for value, numeral in _NUMERAL_TABLE:
        while remainder >= value:
            parts.append(numeral)
            remainder -= value
    return "".join(parts)


def from_roman(s: str) -> int:
    """Decode a canonical Roman numeral to its integer.

    Strict: accepts exactly the canonical numerals :func:`to_roman`
    produces (case-sensitive, subtractive pairs included).

    Raises:
        ValueError: if ``s`` is empty; if it contains a character
            outside ``IVXLCDM`` (naming that character); or if valid
            characters appear in a non-canonical arrangement (naming
            the offending character).
    """
    if not isinstance(s, str):
        raise ValueError(f"s must be a string of Roman numerals; got {s!r}")
    if not s:
        raise ValueError("s must not be empty; expected a Roman numeral")

    for char in s:
        if char not in _VALUES:
            raise ValueError(
                f"invalid character {char!r}: "
                "valid Roman numeral characters are 'IVXLCDM'"
            )

    previous = s[0]
    run = 1
    for char in s[1:]:
        run = run + 1 if char == previous else 1
        previous = char
        if char not in _REPEATABLE and run > 1:
            raise ValueError(
                f"invalid numeral {s!r}: {char!r} must not be repeated"
            )
        if run > _MAX_RUN:
            raise ValueError(
                f"invalid numeral {s!r}: "
                f"{char!r} repeats more than {_MAX_RUN} times"
            )

    total = 0
    index = 0
    while index < len(s):
        char = s[index]
        value = _VALUES[char]
        following = s[index + 1] if index + 1 < len(s) else None
        if following is not None and _VALUES[following] > value:
            if char + following not in _SUBTRACTIVE_PAIRS:
                raise ValueError(
                    f"invalid numeral {s!r}: "
                    f"{following!r} cannot be preceded by {char!r}"
                )
            total += _VALUES[following] - value
            index += 2
        else:
            total += value
            index += 1

    canonical = to_roman(total)
    if canonical != s:
        offender = s[-1]
        for position, char in enumerate(s):
            if position >= len(canonical) or char != canonical[position]:
                offender = char
                break
        raise ValueError(
            f"invalid numeral {s!r}: {offender!r} is not in canonical "
            f"position; the canonical form of {total} is {canonical!r}"
        )
    return total
