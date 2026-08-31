"""Exhaustive round-trip test for the Roman numeral library.

Every integer in the supported domain (the inclusive range 1..3999) is
converted to a Roman numeral with ``to_roman`` and parsed back with
``from_roman``; the result must equal the original integer. The two
functions are imported from the ``romans`` package's public API
(``src/romans/__init__.py``), exactly as downstream consumers import them.
"""

from romans import from_roman, to_roman


def test_roundtrip_is_lossless_over_full_supported_range() -> None:
    """from_roman(to_roman(n)) == n for every n in 1..3999 (inclusive)."""
    for n in range(1, 4000):
        assert from_roman(to_roman(n)) == n
