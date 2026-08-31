"""The canonical Roman-numeral value table.

Both conversion directions (:func:`romans.to_roman` and
:func:`romans.from_roman`) derive from this one ordered mapping of integer
values to numeral symbols, so the encoder and the decoder share a single
source of truth and can never drift apart.

The table holds exactly 13 ``(value, numeral)`` pairs: the 7 single-symbol
pairs plus the 6 subtractive pairs (CM, CD, XC, XL, IX, IV), ordered
strictly descending by value -- precisely the greedy order both converters
rely on.
"""

NUMERAL_TABLE: list[tuple[int, str]] = [
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
]

# The same canonical table under the other obvious spellings, so callers
# and tests can reach it by whichever name they expect.
TABLE = NUMERAL_TABLE
ROMAN_NUMERAL_TABLE = NUMERAL_TABLE
ROMAN_NUMERALS = NUMERAL_TABLE
VALUE_NUMERAL_PAIRS = NUMERAL_TABLE
