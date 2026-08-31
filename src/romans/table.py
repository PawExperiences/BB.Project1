"""The canonical value-to-numeral table for Roman numeral conversion.

This module is the single source of truth for both encoding (greedy
descent over the table) and decoding, so the two directions can never
drift onto separate copies of the data.

The table holds all 13 value/numeral pairs in strictly descending order
by value, including the six subtractive pairs:

    900 -> CM, 400 -> CD, 90 -> XC, 40 -> XL, 9 -> IX, 4 -> IV
"""

NUMERAL_TABLE: tuple[tuple[int, str], ...] = (
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
